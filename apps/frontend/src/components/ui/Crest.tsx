import { Avatar, type AvatarProps } from '@mui/material';
import { useEffect, useState } from 'react';

/**
 * Escudo de equipo (o foto de jugador) que entra enfocándose: mientras la
 * imagen baja se ve la placa con la inicial, y al llegar aparece desenfocada y
 * se aclara en medio segundo, en vez de saltar de golpe. Es un `Avatar` con
 * todo lo suyo; solo agrega el momento de carga.
 *
 * La animación se aplica al `<img>` recién cuando `onLoad` avisa: hacerlo al
 * montar la corría contra el hueco vacío y el escudo aparecía igual de golpe.
 */
export const Crest: React.FC<AvatarProps> = ({ src, sx, slotProps, className, ...rest }) => {
  const [loaded, setLoaded] = useState(false);
  // Si cambia el escudo (edición, otro equipo en la misma tarjeta), vuelve a enfocar.
  useEffect(() => setLoaded(false), [src]);

  return (
    <Avatar
      src={src}
      className={[className, 'llf-crest'].filter(Boolean).join(' ')}
      slotProps={{
        ...slotProps,
        img: {
          ...(slotProps?.img as object),
          onLoad: () => setLoaded(true),
        },
      }}
      sx={{
        '& .MuiAvatar-img': loaded
          ? { animation: 'llfBlurUp 0.55s cubic-bezier(.2,.7,.2,1) both' }
          : { opacity: 0 },
        ...sx,
      }}
      {...rest}
    />
  );
};
