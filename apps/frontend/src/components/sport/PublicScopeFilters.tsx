import {
  Box,
  Card,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import type { ReactNode } from 'react';
import { getCompetitionSubtitle, getCompetitionShortLabel } from '@/utils/competitionMeta';
import { ALL_COMPETITIONS } from '@/hooks/common/usePublicScope';
import type { Edition } from '@/api/editions.api';
import type { Competition } from '@/api/competitions.api';

interface Props {
  editions: Edition[];
  editionId: string;
  onEditionChange: (id: string) => void;
  isCurrentEdition?: boolean;
  competitions: Competition[];
  competitionId: string;
  onCompetitionChange: (id: string) => void;
  allLabel?: string;
  /** Si la pantalla puede mostrar todas las competiciones a la vez. */
  allowAll?: boolean;
  /** Filtros propios de la pantalla (día, estado…). */
  children?: ReactNode;
}

/** Barra de filtros común a las pantallas públicas: edición y competición. */
export const PublicScopeFilters: React.FC<Props> = ({
  editions,
  editionId,
  onEditionChange,
  isCurrentEdition = false,
  competitions,
  competitionId,
  onCompetitionChange,
  allLabel = 'Todas las competiciones',
  allowAll = true,
  children,
}) => (
  <Card sx={{ p: 2, mb: 3 }}>
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      alignItems={{ md: 'center' }}
      useFlexGap
      sx={{ flexWrap: 'wrap' }}
    >
      <FormControl size="small" sx={{ minWidth: 190 }}>
        <InputLabel>Edición</InputLabel>
        <Select
          label="Edición"
          value={editionId}
          onChange={(e) => onEditionChange(e.target.value as string)}
        >
          {editions.map((e) => (
            <MenuItem key={e.id} value={e.id}>
              {e.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {isCurrentEdition && (
        <Chip size="small" color="success" variant="outlined" label="Edición en curso" />
      )}

      <FormControl size="small" sx={{ minWidth: 260 }}>
        <InputLabel>Competición</InputLabel>
        <Select
          label="Competición"
          value={competitionId}
          onChange={(e) => onCompetitionChange(e.target.value as string)}
          renderValue={(value) => {
            const c = competitions.find((x) => x.id === value);
            // Cerrado tambien tiene que decir la division, no solo el nombre.
            if (c) return getCompetitionShortLabel(c);
            return allowAll ? allLabel : '—';
          }}
        >
          {allowAll && <MenuItem value={ALL_COMPETITIONS}>{allLabel}</MenuItem>}
          {competitions.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {c.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getCompetitionSubtitle(c)}
                </Typography>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {children}
    </Stack>
  </Card>
);
