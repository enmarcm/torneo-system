import { Box, Button, Card, Stack, Typography } from '@mui/material';
import { ChevronRightRounded } from '@mui/icons-material';
import type { TeamRegistrationWithRoster } from '@/api/teams.api';
import { AGE_GROUP_LABELS, getCompetitionShortLabel, getCompetitionSubtitle } from '@/utils/competitionMeta';
import { canManageRoster } from '@/utils/teamRegistrations';
import { StatusBadge } from '@/components/ui/StatusBadge';

export function TeamTournamentList({ registrations, onManage }: {
  registrations: TeamRegistrationWithRoster[];
  onManage: (registrationId: string) => void;
}) {
  return <Card variant="outlined" sx={{ display: { xs: 'block', md: 'none' }, overflow: 'hidden', boxShadow: 'none' }}>
    {registrations.map((registration, index) => {
      const competition = registration.competition;
      const count = registration.roster.filter((entry) => entry.status === 'ACTIVE').length;
      const editable = canManageRoster(registration);
      const edition = competition.edition;
      const editionLabel = edition ? (edition.name.includes(String(edition.year)) ? edition.name : `${edition.name} · ${edition.year}`) : '';
      return <Box component="details" key={registration.id} sx={{ borderTop: index ? '1px solid' : undefined, borderColor: 'divider', '&[open] .tournament-chevron': { transform: 'rotate(90deg)' } }}>
        <Box component="summary" sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, minHeight: 80, cursor: 'pointer', listStyle: 'none', '&::-webkit-details-marker': { display: 'none' }, '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -3 } }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600, overflowWrap: 'anywhere' }}>{getCompetitionShortLabel(competition)}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, overflowWrap: 'anywhere' }}>{[AGE_GROUP_LABELS[competition.ageGroup], editionLabel].filter(Boolean).join(' · ')}</Typography>
            <Box sx={{ mt: 0.75 }}><StatusBadge status={competition.status} /></Box>
          </Box>
          <Typography variant="caption" color="text.secondary" aria-label={`${count} de ${competition.maxPlayers} jugadores`} sx={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{count}/{competition.maxPlayers}</Typography>
          <ChevronRightRounded className="tournament-chevron" sx={{ fontSize: 20, flexShrink: 0, color: 'text.secondary' }} />
        </Box>
        <Stack spacing={1.5} sx={{ px: 1.5, pb: 1.5 }}>
          <Typography variant="body2" color="text.secondary">{getCompetitionSubtitle(competition)}</Typography>
          <Typography variant="caption" color="text.secondary">{competition.ageMin != null ? `Desde ${competition.ageMin} años` : 'Sin edad mínima'}{competition.ageMax != null ? ` · Hasta ${competition.ageMax} años` : ''}</Typography>
          <Button variant={editable ? 'contained' : 'outlined'} onClick={() => onManage(registration.id)} sx={{ minHeight: 44, boxShadow: 'none' }}>{editable ? 'Gestionar jugadores' : 'Ver plantilla'}</Button>
        </Stack>
      </Box>;
    })}
  </Card>;
}
