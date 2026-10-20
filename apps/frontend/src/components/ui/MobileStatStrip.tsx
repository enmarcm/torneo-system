import { Box, Card, Typography } from '@mui/material';

export function MobileStatStrip({ items }: { items: Array<{ label: string; value: number }> }) {
  return <Card variant="outlined" sx={{ display: { xs: 'grid', md: 'none' }, gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`, py: 1.5, boxShadow: 'none', my: 2 }}>
    {items.map((item, index) => <Box key={item.label} sx={{ textAlign: 'center', px: 1, minWidth: 0, borderLeft: index ? '1px solid' : undefined, borderColor: 'divider' }}>
      <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: 24, lineHeight: 1.25, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>{item.value}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, overflowWrap: 'anywhere' }}>{item.label}</Typography>
    </Box>)}
  </Card>;
}
