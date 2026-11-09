import { prisma } from '@/lib/prisma';
import { AppError } from '@/utils/app-error';
import { trashService } from '@/modules/trash/trash.service';
import { DEFAULT_LEGAL_PAGES, DEFAULT_SETTINGS } from './site.defaults';

const SETTINGS_ID = 'main';

export type SettingsInput = Partial<typeof DEFAULT_SETTINGS>;
export interface LegalPageInput {
  title: string;
  body: string;
  published: boolean;
  showInFooter: boolean;
  sortOrder: number;
}

/**
 * Crea la configuración y las páginas legales base la primera vez que hacen
 * falta. Se hace acá y no en el seed para que un despliegue nuevo, o uno que ya
 * existía antes de esta función, funcione sin pasos manuales.
 *
 * Las páginas solo se siembran junto con la configuración: si el admin borra una,
 * no reaparece en la siguiente lectura.
 */
let bootstrapped = false;
const bootstrap = async () => {
  if (bootstrapped) return;
  const existing = await prisma.siteSettings.findUnique({ where: { id: SETTINGS_ID } });
  if (!existing) {
    await prisma.siteSettings.createMany({
      data: [{ id: SETTINGS_ID, ...DEFAULT_SETTINGS }],
      skipDuplicates: true,
    });
    await prisma.legalPage.createMany({ data: DEFAULT_LEGAL_PAGES, skipDuplicates: true });
  }
  bootstrapped = true;
};

/**
 * Reemplaza {{marcadores}} con los datos de la configuración. Un marcador vacío
 * dejaba un espacio suelto ("Liga Lago Futsal , con domicilio"), así que al final
 * se quita el espacio que quede antes de la puntuación.
 */
const fill = (text: string, s: { siteName: string; legalName: string; taxId: string } & Record<string, unknown>) =>
  text
    .replace(/\{\{(\w+)\}\}/g, (_m, key: string) => {
      // Sin razón social, el responsable es la liga misma: evita dejar un hueco en el texto.
      if (key === 'legalName') return s.legalName || s.siteName;
      if (key === 'taxId') return s.taxId ? `(${s.taxId})` : '';
      return String(s[key] ?? '');
    })
    .replace(/[ \t]+([,.;:])/g, '$1');

export const siteService = {
  getSettings: async () => {
    await bootstrap();
    return prisma.siteSettings.findUniqueOrThrow({ where: { id: SETTINGS_ID } });
  },

  updateSettings: async (data: SettingsInput) => {
    await bootstrap();
    return prisma.siteSettings.update({ where: { id: SETTINGS_ID }, data });
  },

  /** Lo que necesita el pie del sitio: los datos y los enlaces legales visibles. */
  publicSite: async () => {
    const [settings, pages] = await Promise.all([
      siteService.getSettings(),
      prisma.legalPage.findMany({
        where: { published: true, showInFooter: true },
        orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
        select: { slug: true, title: true },
      }),
    ]);
    const { id: _id, updatedAt: _updatedAt, ...rest } = settings;
    return { settings: rest, legalPages: pages };
  },

  publicLegalPage: async (slug: string) => {
    const [settings, page] = await Promise.all([
      siteService.getSettings(),
      prisma.legalPage.findUnique({ where: { slug } }),
    ]);
    if (!page || !page.published) throw new AppError(404, 'Página no encontrada', 'LEGAL_PAGE_NOT_FOUND');
    return {
      slug: page.slug,
      title: page.title,
      body: fill(page.body, settings),
      updatedAt: page.updatedAt,
    };
  },

  listLegalPages: async () => {
    await bootstrap();
    return prisma.legalPage.findMany({ orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }] });
  },

  createLegalPage: async (data: LegalPageInput & { slug: string }) => {
    if (await prisma.legalPage.findUnique({ where: { slug: data.slug } })) {
      throw new AppError(409, 'Ya existe una página con ese enlace', 'LEGAL_SLUG_TAKEN');
    }
    return prisma.legalPage.create({ data });
  },

  updateLegalPage: (id: string, data: Partial<LegalPageInput>) =>
    prisma.legalPage.update({ where: { id }, data }),

  removeLegalPage: (id: string, actorId?: string) =>
    trashService.withTrash('LEGAL_PAGE', id, actorId, async (tx) => {
      await tx.legalPage.delete({ where: { id } });
      return { id };
    }),
};
