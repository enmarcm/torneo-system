import { Chip, Stack } from '@mui/material';
import { getCompetitionTags, type CompetitionLike } from '@/utils/competitionMeta';

interface Props {
  competition: CompetitionLike;
  /** Sobre fondo de color (héroes, cabeceras oscuras) los chips se aclaran. */
  onDark?: boolean;
  max?: number;
}

/**
 * Etiquetas de un torneo: división, copa, menores, gremial, categoría y edades.
 * Es lo que le dice al visitante en qué está mirando.
 */
export const CompetitionTags: React.FC<Props> = ({ competition, onDark = false, max }) => {
  const tags = getCompetitionTags(competition);
  if (tags.length === 0) return null;
  const shown = max ? tags.slice(0, max) : tags;

  return (
    <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: 'wrap' }}>
      {shown.map((t) => (
        <Chip
          key={t.label}
          size="small"
          label={t.label}
          color={onDark ? 'default' : t.color}
          variant={onDark || t.color === 'default' ? 'outlined' : 'filled'}
          sx={{
            height: 22,
            fontSize: 11,
            fontWeight: 700,
            ...(onDark
              ? { color: '#fff', borderColor: 'rgba(255,255,255,0.45)', bgcolor: 'rgba(255,255,255,0.12)' }
              : {}),
          }}
        />
      ))}
    </Stack>
  );
};
