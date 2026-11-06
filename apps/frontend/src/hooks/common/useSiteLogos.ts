import { usePublicSiteQuery } from '@/hooks/queries';
import logoAzul from '@/assets/logo_azul.PNG';
import logoBlanco from '@/assets/logo.PNG';

/**
 * Los logos del sitio: el que el administrador subió, o el que trae por defecto.
 *
 * Hay uno para fondo claro y otro para fondo oscuro (o la portada). Si solo se
 * sube uno, se usa en los dos casos; si no se sube ninguno, quedan los de siempre.
 * `personalizado` avisa que el logo ya no es el escudo redondo original, para no
 * recortarlo en círculo.
 */
export const useSiteLogos = () => {
  const { data } = usePublicSiteQuery();
  const claro = data?.settings.logoUrl || '';
  const oscuro = data?.settings.logoDarkUrl || '';
  return {
    // Con solo el logo oscuro subido, el claro sigue siendo el de siempre: el
    // oscuro sobre fondo claro no se vería.
    claro: claro || logoAzul,
    oscuro: oscuro || claro || logoBlanco,
    personalizado: !!(claro || oscuro),
  };
};
