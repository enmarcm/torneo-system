import { useMemo, useState } from 'react';
import {
  Box,
  Container,
  Grid2 as Grid,
  Card,
  Stack,
  Typography,
  Button,
  Chip,
} from '@mui/material';
import { ArrowBackRounded, NewspaperRounded, InsightsRounded } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePublicNewsQuery } from '@/hooks/queries';
import { EmptyState } from '@/components/ui/EmptyState';
import { NewsCardSkeleton } from '@/components/ui/LoadingState';
import { ROUTES } from '@/routes/routes';
import { formatDate } from '@/utils/formatDate';
import { ARTICLE_KIND_LABEL, isSheet, type Article, type ArticleKind } from '@/api/news.api';

const FILTERS: { value: ArticleKind | ''; label: string }[] = [
  { value: '', label: 'Todo' },
  { value: 'NEWS', label: 'Noticias' },
  { value: 'EDITION_SHEET', label: 'Ediciones' },
  { value: 'COMPETITION_SHEET', label: 'Torneos' },
  { value: 'TEAM_SHEET', label: 'Equipos' },
];

/** De qué habla la nota, para la línea chica de la tarjeta. */
const subjectOf = (a: Article) =>
  a.edition?.name ?? a.competition?.name ?? a.team?.name ?? null;

const PublicNews: React.FC = () => {
  const navigate = useNavigate();
  const [kind, setKind] = useState<ArticleKind | ''>('');
  const { data: articles = [], isLoading } = usePublicNewsQuery();

  const visible = useMemo(
    () => (kind ? articles.filter((a) => a.kind === kind) : articles),
    [articles, kind],
  );

  // La destacada abre el apartado a lo ancho; el resto va en la grilla.
  const [lead, ...rest] = visible;

  const Cover: React.FC<{ article: Article; height: number }> = ({ article, height }) =>
    article.coverUrl ? (
      <Box
        component="img"
        src={article.coverUrl}
        alt=""
        sx={{ width: '100%', height, objectFit: 'cover', display: 'block' }}
      />
    ) : (
      <Box
        sx={{
          width: '100%',
          height,
          display: 'grid',
          placeItems: 'center',
          bgcolor: 'primary.soft',
          color: 'primary.main',
        }}
      >
        {isSheet(article.kind) ? (
          <InsightsRounded sx={{ fontSize: 40 }} />
        ) : (
          <NewspaperRounded sx={{ fontSize: 40 }} />
        )}
      </Box>
    );

  const Meta: React.FC<{ article: Article }> = ({ article }) => (
    <Stack direction="row" spacing={1} alignItems="center" useFlexGap flexWrap="wrap" sx={{ mb: 1 }}>
      <Chip
        size="small"
        label={ARTICLE_KIND_LABEL[article.kind]}
        color={isSheet(article.kind) ? 'primary' : 'default'}
        variant={isSheet(article.kind) ? 'filled' : 'outlined'}
        sx={{ height: 22, fontWeight: 700, fontSize: 11 }}
      />
      {subjectOf(article) && (
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          {subjectOf(article)}
          {article.year ? ` · ${article.year}` : ''}
        </Typography>
      )}
      {article.publishedAt && (
        <Typography variant="caption" color="text.disabled">
          {formatDate(article.publishedAt)}
        </Typography>
      )}
    </Stack>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Button
        startIcon={<ArrowBackRounded />}
        onClick={() => navigate(ROUTES.public.home)}
        sx={{ mb: 1, color: 'text.secondary' }}
      >
        Volver
      </Button>
      <Typography variant="h2" sx={{ mb: 0.5 }}>
        Noticias
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Notas del torneo y fichas técnicas con los números de cada edición, torneo y club.
      </Typography>

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', mb: 3 }}>
        {FILTERS.map((f) => (
          <Chip
            key={f.label}
            label={f.label}
            color={kind === f.value ? 'primary' : 'default'}
            onClick={() => setKind(f.value)}
            sx={{ fontWeight: 600 }}
          />
        ))}
      </Stack>

      {isLoading ? (
        <NewsCardSkeleton count={3} />
      ) : visible.length === 0 ? (
        <EmptyState
          variant="news"
          title={articles.length ? 'Nada por acá todavía' : 'Todavía no hay noticias'}
          description={
            articles.length
              ? 'Probá con otra sección.'
              : 'Acá van las crónicas de cada fecha, los comunicados y las fichas de MVP.'
          }
        />
      ) : (
        <Stack spacing={3}>
          <Card
            component={motion.div}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="llf-cardlink"
            transition={{ duration: 0.25 }}
            sx={{ overflow: 'hidden', cursor: 'pointer' }}
            onClick={() => navigate(`/noticias/${lead.slug}`)}
          >
            <Grid container>
              <Grid size={{ xs: 12, md: 7 }}>
                <Cover article={lead} height={320} />
              </Grid>
              <Grid size={{ xs: 12, md: 5 }}>
                <Box sx={{ p: { xs: 2.5, md: 4 } }}>
                  <Meta article={lead} />
                  <Typography variant="h2" sx={{ mb: 1 }}>
                    {lead.title}
                  </Typography>
                  {lead.summary && (
                    <Typography color="text.secondary">{lead.summary}</Typography>
                  )}
                  <Button sx={{ mt: 2, px: 0 }}>Leer la nota</Button>
                </Box>
              </Grid>
            </Grid>
          </Card>

          {rest.length > 0 && (
            <Grid container spacing={2}>
              {rest.map((a, i) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={a.id}>
                  <Card
                    component={motion.div}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i * 0.04, 0.24) }}
                    className="llf-cardlink"
                    sx={{
                      height: '100%',
                      overflow: 'hidden',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                    onClick={() => navigate(`/noticias/${a.slug}`)}
                  >
                    <Cover article={a} height={168} />
                    <Box sx={{ p: 2.5, flex: 1 }}>
                      <Meta article={a} />
                      <Typography variant="h4" sx={{ mb: 0.5 }}>
                        {a.title}
                      </Typography>
                      {a.summary && (
                        <Typography variant="body2" color="text.secondary">
                          {a.summary}
                        </Typography>
                      )}
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Stack>
      )}
    </Container>
  );
};

export default PublicNews;
