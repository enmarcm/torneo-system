import { Box, Typography } from '@mui/material';

type Block =
  | { kind: 'heading'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'paragraph'; lines: string[] };

/**
 * Los textos legales se escriben como texto plano: "## " abre una sección, "- "
 * una viñeta y una línea en blanco separa párrafos. Es lo mismo que sabe
 * escribir cualquiera del staff, sin tener que aprender un formato.
 */
const parse = (body: string): Block[] => {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: string[] = [];

  const flush = () => {
    if (paragraph.length) blocks.push({ kind: 'paragraph', lines: paragraph });
    if (list.length) blocks.push({ kind: 'list', items: list });
    paragraph = [];
    list = [];
  };

  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) {
      flush();
    } else if (line.startsWith('## ')) {
      flush();
      blocks.push({ kind: 'heading', text: line.slice(3).trim() });
    } else if (line.startsWith('- ')) {
      if (paragraph.length) flush();
      list.push(line.slice(2).trim());
    } else {
      if (list.length) flush();
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
};

export const LegalText: React.FC<{ body: string }> = ({ body }) => (
  <Box>
    {parse(body).map((b, i) => {
      if (b.kind === 'heading') {
        return (
          <Typography key={i} component="h2" variant="h3" sx={{ mt: 4, mb: 1.25, fontSize: { xs: 19, md: 21 } }}>
            {b.text}
          </Typography>
        );
      }
      if (b.kind === 'list') {
        return (
          <Box key={i} component="ul" sx={{ m: 0, mb: 2, pl: 3 }}>
            {b.items.map((item, j) => (
              <Typography key={j} component="li" sx={{ fontSize: 16, lineHeight: 1.7, mb: 0.75 }}>
                {item}
              </Typography>
            ))}
          </Box>
        );
      }
      return (
        <Typography key={i} sx={{ fontSize: 16, lineHeight: 1.75, mb: 2, whiteSpace: 'pre-line' }}>
          {b.lines.join('\n')}
        </Typography>
      );
    })}
  </Box>
);
