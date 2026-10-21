import { Autocomplete, Box, Checkbox, TextField, Typography } from '@mui/material';
import type { TeamRegistrationWithRoster } from '@/api/teams.api';
import { getCompetitionShortLabel, AGE_GROUP_LABELS } from '@/utils/competitionMeta';
import { playerTournamentBlockedReason } from '@/utils/playerTournamentRegistrations';

export function PlayerTournamentSelect({ registrations, value, onChange, playerId, disabled = false }: {
  registrations: TeamRegistrationWithRoster[];
  value: string[];
  onChange: (ids: string[]) => void;
  playerId?: string;
  disabled?: boolean;
}) {
  const label = (registration: TeamRegistrationWithRoster) => [
    getCompetitionShortLabel(registration.competition),
    AGE_GROUP_LABELS[registration.competition.ageGroup],
    registration.competition.edition?.name,
  ].filter(Boolean).join(' · ');
  return (
    <Autocomplete
      multiple disableCloseOnSelect disabled={disabled}
      options={registrations}
      value={registrations.filter((registration) => value.includes(registration.id))}
      isOptionEqualToValue={(option, selected) => option.id === selected.id}
      getOptionKey={(registration) => registration.id}
      getOptionLabel={label}
      getOptionDisabled={(registration) => !!playerTournamentBlockedReason(registration, playerId)}
      onChange={(_event, selected) => onChange(selected.map((registration) => registration.id))}
      noOptionsText="Este equipo no tiene torneos inscritos"
      renderInput={(params) => <TextField {...params} label="Torneos" placeholder={value.length ? '' : 'Selecciona uno o varios'} helperText="Cada torneo valida su cupo y habilitación por separado." />}
      renderOption={(props, registration, { selected }) => {
        const { key, ...optionProps } = props;
        const reason = playerTournamentBlockedReason(registration, playerId);
        return (
          <Box component="li" key={registration.id} {...optionProps}>
            <Checkbox checked={selected} tabIndex={-1} disableRipple inputProps={{ 'aria-label': label(registration) }} sx={{ pointerEvents: 'none' }} />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{label(registration)}</Typography>
              {reason && <Typography variant="caption" color="text.secondary">{reason}</Typography>}
            </Box>
          </Box>
        );
      }}
      sx={{ '& .MuiAutocomplete-tag': { maxWidth: 'calc(100% - 8px)', height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', py: 0.5 } } }}
    />
  );
}
