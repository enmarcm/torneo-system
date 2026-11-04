import { Container, Stack, Typography, Button } from '@mui/material';
import GavelRounded from '@mui/icons-material/GavelRounded';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import { useNavigate, useParams } from 'react-router-dom';
import { usePublicLegalPageQuery, usePublicSiteQuery } from '@/hooks/queries';
import { LegalText } from '@/components/ui/LegalText';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ROUTES, legalPath } from '@/routes/routes';
import { formatDate } from '@/utils/formatDate';

const PublicLegal: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: page, isLoading, error } = usePublicLegalPageQuery(slug);
  const { data: site } = usePublicSiteQuery();

  // Los otros documentos, para saltar de uno a otro sin volver al pie.
  const others = (site?.legalPages ?? []).filter((p) => p.slug !== slug);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 5 } }}>
      <Button
        startIcon={<ArrowBackRounded />}
        onClick={() => navigate(ROUTES.public.home)}
        sx={{ mb: 1, color: 'text.secondary' }}
      >
        Inicio
      </Button>

      {isLoading ? (
        <LoadingState rows={4} />
      ) : error || !page ? (
        <EmptyState
          icon={<GavelRounded sx={{ fontSize: 32 }} />}
          title="No encontramos este documento"
          description="Puede que se haya retirado o que el enlace esté mal."
          actionLabel="Ir al inicio"
          onAction={() => navigate(ROUTES.public.home)}
        />
      ) : (
        <>
          <Typography component="h1" variant="h1" sx={{ mb: 0.5 }}>
            {page.title}
          </Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 3 }}>
            Última actualización: {formatDate(page.updatedAt)}
          </Typography>

          <LegalText body={page.body} />

          {others.length > 0 && (
            <Stack
              direction="row"
              useFlexGap
              flexWrap="wrap"
              spacing={1}
              sx={{ mt: 6, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}
            >
              {others.map((p) => (
                <Button key={p.slug} size="small" variant="outlined" onClick={() => navigate(legalPath(p.slug))}>
                  {p.title}
                </Button>
              ))}
            </Stack>
          )}
        </>
      )}
    </Container>
  );
};

export default PublicLegal;
