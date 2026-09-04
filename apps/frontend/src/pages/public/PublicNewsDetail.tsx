import { Box, Container, Card, Stack, Typography, Button, Chip } from '@mui/material';
import { ArrowBackRounded, NewspaperRounded } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePublicNewsBySlugQuery } from '@/hooks/queries';
import { FactSheetView } from '@/components/sport/FactSheetView';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';
import { ROUTES } from '@/routes/routes';
import { formatDate } from '@/utils/formatDate';
import { ARTICLE_KIND_LABEL, isSheet } from '@/api/news.api';

const PublicNewsDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: article, isLoading, error } = usePublicNewsBySlugQuery(slug);

  const subject = article?.edition?.name ?? article?.competition?.name ?? article?.team?.name;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackRounded />}
        onClick={() => navigate(ROUTES.public.news)}
        sx={{ mb: 1, color: 'text.secondary' }}
      >
        Todas las noticias
      </Button>

      {isLoading ? (
        <LoadingState rows={3} />
      ) : error || !article ? (
        <EmptyState
          icon={<NewspaperRounded sx={{ fontSize: 32 }} />}
          title="No encontramos esta nota"
          description="Puede que se haya despublicado o que el enlace esté mal."
          actionLabel="Ver las noticias"
          onAction={() => navigate(ROUTES.public.news)}
        />
      ) : (
        <Stack
          spacing={3}
          component={motion.div}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap" sx={{ mb: 1.5 }}>
              <Chip
                size="small"
                label={ARTICLE_KIND_LABEL[article.kind]}
                color={isSheet(article.kind) ? 'primary' : 'default'}
                variant={isSheet(article.kind) ? 'filled' : 'outlined'}
                sx={{ fontWeight: 700 }}
              />
              {subject && (
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  {subject}
                  {article.year ? ` · ${article.year}` : ''}
                </Typography>
              )}
              {article.publishedAt && (
                <Typography variant="body2" color="text.disabled">
                  {formatDate(article.publishedAt)}
                </Typography>
              )}
            </Stack>

            <Typography variant="h1" sx={{ mb: 1 }}>
              {article.title}
            </Typography>
            {article.summary && (
              <Typography variant="h4" color="text.secondary" sx={{ fontWeight: 500 }}>
                {article.summary}
              </Typography>
            )}
          </Box>

          {article.coverUrl && (
            <Card sx={{ overflow: 'hidden' }}>
              <Box
                component="img"
                src={article.coverUrl}
                alt={article.title}
                sx={{ width: '100%', display: 'block', maxHeight: 460, objectFit: 'cover' }}
              />
            </Card>
          )}

          {/* Texto plano: los saltos de línea del redactor se respetan tal cual. */}
          {article.body.trim() && (
            <Typography
              sx={{
                whiteSpace: 'pre-line',
                fontSize: 17,
                lineHeight: 1.75,
                color: 'text.primary',
              }}
            >
              {article.body}
            </Typography>
          )}

          {article.snapshot && (
            <Box>
              <Typography variant="h3" sx={{ mb: 2 }}>
                Ficha técnica
              </Typography>
              <FactSheetView sheet={article.snapshot} />
            </Box>
          )}
        </Stack>
      )}
    </Container>
  );
};

export default PublicNewsDetail;
