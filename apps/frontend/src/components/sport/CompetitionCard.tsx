import { Box, Card, Stack, Typography } from '@mui/material';
import { SportsSoccerRounded, GroupsRounded } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { CompetitionTags } from './CompetitionTags';
import type { CompetitionLike } from '@/utils/competitionMeta';

interface Props {
  competition: CompetitionLike & {
    imageUrl?: string | null;
    _count?: { registrations: number };
  };
  onClick?: () => void;
}

/**
 * Portada de un torneo: la foto que cargó el administrador de fondo y encima el
 * nombre con sus etiquetas. Es la pieza con la que el visitante elige a dónde
 * entrar, así que pesa la imagen, no la ficha técnica.
 *
 * Sin foto cargada no queda un hueco gris: se pinta el degradado de la marca
 * con el balón de fondo.
 */
export const CompetitionCard: React.FC<Props> = ({ competition, onClick }) => {
  const teams = competition._count?.registrations ?? 0;

  return (
    <Card
      component={motion.div}
      whileHover={{ y: -4 }}
      onClick={onClick}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        height: { xs: 200, md: 240 },
        display: 'flex',
        alignItems: 'flex-end',
        color: '#fff',
        background: 'var(--heroGradient)',
        cursor: onClick ? 'pointer' : 'default',
        '&:hover .competition-card__bg': { transform: 'scale(1.06)' },
      }}
    >
      {competition.imageUrl ? (
        <Box
          className="competition-card__bg"
          component="img"
          src={competition.imageUrl}
          alt=""
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.5s ease',
          }}
        />
      ) : (
        <SportsSoccerRounded
          className="competition-card__bg"
          sx={{
            position: 'absolute',
            right: -28,
            bottom: -28,
            fontSize: 210,
            opacity: 0.14,
            transition: 'transform 0.5s ease',
          }}
        />
      )}

      {/* La foto no manda sobre el texto: se oscurece de abajo hacia arriba. */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(180deg, rgba(12,16,28,0.10) 0%, rgba(12,16,28,0.55) 45%, rgba(12,16,28,0.90) 100%)',
        }}
      />

      <Stack spacing={1.25} sx={{ position: 'relative', width: '100%', p: { xs: 2, md: 2.5 } }}>
        <Typography
          sx={{
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontWeight: 800,
            fontSize: { xs: 20, md: 26 },
            lineHeight: 1.15,
            textShadow: '0 1px 12px rgba(0,0,0,0.45)',
          }}
        >
          {competition.name}
        </Typography>

        <CompetitionTags competition={competition} onDark />

        {teams > 0 && (
          <Stack direction="row" alignItems="center" spacing={0.75} sx={{ opacity: 0.85 }}>
            <GroupsRounded sx={{ fontSize: 16 }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {teams} {teams === 1 ? 'equipo' : 'equipos'}
            </Typography>
          </Stack>
        )}
      </Stack>
    </Card>
  );
};
