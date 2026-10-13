import { Tab, Tabs } from '@mui/material';
import type { Competition } from '@/api/competitions.api';
import { AGE_GROUP_LABELS, getCompetitionAgeGroup, type CompetitionLike } from '@/utils/competitionMeta';

interface Props {
  value: Competition['ageGroup'];
  onChange: (value: Competition['ageGroup']) => void;
  competitions: CompetitionLike[];
}

export const CompetitionSectionTabs: React.FC<Props> = ({ value, onChange, competitions }) => (
  <Tabs value={value} onChange={(_, next: Competition['ageGroup']) => onChange(next)} aria-label="Apartados de competiciones" sx={{ mb: 2 }}>
    {(['ADULT', 'YOUTH'] as const).map((group) => (
      <Tab key={group} value={group} label={`${AGE_GROUP_LABELS[group]} (${competitions.filter((c) => getCompetitionAgeGroup(c) === group).length})`} sx={{ textTransform: 'none' }} />
    ))}
  </Tabs>
);
