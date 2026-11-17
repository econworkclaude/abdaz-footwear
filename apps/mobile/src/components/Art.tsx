import Svg, { Circle, Defs, Ellipse, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import type { Colourway, Product } from '@/types';
import { colors } from '@/theme';

/** Original ABDAZ mark: a stylised "A" whose crossbar is a step. */
export function LogoMark({ size = 64 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.goldLight} />
          <Stop offset="0.55" stopColor={colors.gold} />
          <Stop offset="1" stopColor={colors.goldDark} />
        </LinearGradient>
      </Defs>
      <Path d="M50 8 L90 92 L72 92 L50 42 L28 92 L10 92 Z" fill="url(#lg)" />
      <Path d="M30 70 L52 70 L52 62 L70 62 L74 72 L56 72 L56 80 L27 80 Z" fill={colors.bg} />
      <Path d="M33 72 L54 72 L54 64 L68 64 L70 69 L58 69 L58 77 L31 77 Z" fill="url(#lg)" />
    </Svg>
  );
}

export function Wordmark({ size = 1 }: { size?: number }) {
  return (
    <Svg width={220 * size} height={70 * size} viewBox="0 0 220 70">
      <Defs>
        <LinearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={colors.goldLight} />
          <Stop offset="1" stopColor={colors.gold} />
        </LinearGradient>
      </Defs>
      <SvgText x="110" y="40" textAnchor="middle" fontSize="40" fontWeight="800" letterSpacing="6" fontFamily="Inter, Roboto, Helvetica, Arial, sans-serif" fill="url(#wg)">
        ABDAZ
      </SvgText>
      <SvgText x="110" y="62" textAnchor="middle" fontSize="13" fontWeight="600" letterSpacing="9" fontFamily="Inter, Roboto, Helvetica, Arial, sans-serif" fill={colors.text}>
        FOOTWEAR
      </SvgText>
    </Svg>
  );
}

/** Original vector shoe illustration, coloured per variant. Placeholder until real product photos are uploaded. */
export function ShoeArt({ product, colour, width = 160 }: { product: Product; colour?: Colourway; width?: number }) {
  const c = colour ?? product.colours[0];
  const h = width * 0.6;
  return (
    <Svg width={width} height={h} viewBox="0 0 200 120">
      <Ellipse cx="100" cy="108" rx="88" ry="6" fill="#000" opacity={0.25} />
      {product.style === 'low' && <LowTop c={c} />}
      {product.style === 'runner' && <Runner c={c} />}
      {product.style === 'formal' && <Formal c={c} />}
      {product.style === 'slide' && <Slide c={c} />}
      {product.style === 'sandal' && <Sandal c={c} />}
    </Svg>
  );
}

const stroke = 'rgba(0,0,0,0.18)';

function LowTop({ c }: { c: Colourway }) {
  return (
    <G>
      <Path d="M12 92 Q12 102 24 102 L182 102 Q194 102 194 92 L194 86 L12 86 Z" fill={c.sole} stroke={stroke} />
      <Path d="M14 86 L14 62 Q16 46 34 44 L58 42 Q70 24 92 22 L106 22 Q112 32 124 42 Q154 54 180 62 Q194 68 194 86 Z" fill={c.upper} stroke={stroke} />
      <Path d="M14 86 L14 62 Q16 47 34 45 L46 45 L50 86 Z" fill={c.accent} opacity={0.95} />
      <Path d="M162 64 Q188 68 193 84 L160 84 Q158 72 162 64 Z" fill={c.accent} opacity={0.95} />
      <Path d="M58 42 Q70 26 92 24 L104 24 Q100 34 96 42 Z" fill="rgba(0,0,0,0.12)" />
      {[0, 1, 2, 3].map((i) => (
        <Line key={i} x1={100 + i * 10} y1={36 + i * 4} x2={112 + i * 10} y2={32 + i * 4} stroke={c.accent} strokeWidth={3} strokeLinecap="round" />
      ))}
      <Circle cx="34" cy="70" r="5" fill={colors.gold} />
      <Line x1="20" y1="94" x2="186" y2="94" stroke={stroke} strokeDasharray="3 4" />
    </G>
  );
}

function Runner({ c }: { c: Colourway }) {
  return (
    <G>
      <Path d="M10 88 Q20 104 40 104 L176 104 Q196 104 196 88 Q180 82 160 86 Q120 92 80 84 Q40 78 10 88 Z" fill={c.sole} stroke={stroke} />
      <Path d="M14 86 Q12 60 30 46 L56 38 Q68 18 94 18 Q104 30 120 38 Q156 52 184 64 Q198 72 194 86 Q160 82 120 88 Q70 80 14 86 Z" fill={c.upper} stroke={stroke} />
      <Path d="M40 80 Q80 56 130 60 Q160 62 182 72 L180 78 Q150 70 128 70 Q86 70 46 86 Z" fill={c.accent} />
      <Path d="M56 38 Q68 20 92 20 L96 26 Q74 30 64 44 Z" fill="rgba(0,0,0,0.15)" />
      {[0, 1, 2].map((i) => (
        <Line key={i} x1={102 + i * 11} y1={32 + i * 5} x2={114 + i * 11} y2={28 + i * 5} stroke="#fff" strokeWidth={3} strokeLinecap="round" opacity={0.8} />
      ))}
      <Rect x="18" y="52" width="8" height="18" rx="3" fill={colors.gold} />
    </G>
  );
}

function Formal({ c }: { c: Colourway }) {
  return (
    <G>
      <Path d="M14 96 L14 102 L50 102 L50 96 Z" fill={c.sole} />
      <Path d="M50 98 L190 98 Q196 98 196 94 L196 92 L50 92 Z" fill={c.sole} />
      <Path d="M16 96 L16 64 Q18 52 34 50 L70 48 Q90 40 110 44 Q150 56 182 70 Q198 78 196 92 L16 96 Z" fill={c.upper} stroke={stroke} />
      <Path d="M70 48 Q90 40 110 44 L118 52 Q96 50 78 58 Z" fill="rgba(0,0,0,0.25)" />
      <Path d="M150 62 Q170 70 182 82" stroke={c.accent} strokeWidth={2} fill="none" />
      <Path d="M24 66 Q60 62 96 66" stroke="rgba(255,255,255,0.18)" strokeWidth={2} fill="none" />
      {[0, 1, 2].map((i) => (
        <Line key={i} x1={84 + i * 8} y1={52 + i * 2} x2={92 + i * 8} y2={50 + i * 2} stroke={colors.goldLight} strokeWidth={2} strokeLinecap="round" />
      ))}
    </G>
  );
}

function Slide({ c }: { c: Colourway }) {
  return (
    <G>
      <Path d="M12 92 Q12 102 26 102 L180 102 Q196 102 196 90 Q196 84 186 84 L22 84 Q12 84 12 92 Z" fill={c.sole} stroke={stroke} />
      <Path d="M70 84 Q72 44 110 40 Q150 40 156 84 Z" fill={c.upper} stroke={stroke} />
      <Path d="M86 60 L140 60" stroke={c.accent} strokeWidth={6} strokeLinecap="round" />
      <Circle cx="113" cy="60" r="6" fill={colors.gold} />
    </G>
  );
}

function Sandal({ c }: { c: Colourway }) {
  return (
    <G>
      <Path d="M12 92 Q12 102 26 102 L180 102 Q196 102 196 90 Q196 84 186 84 L22 84 Q12 84 12 92 Z" fill={c.sole} stroke={stroke} />
      <Path d="M20 84 Q22 50 48 46 L58 48 Q44 60 40 84 Z" fill={c.upper} />
      <Path d="M70 84 Q80 54 110 52 L118 60 Q92 64 86 84 Z" fill={c.upper} />
      <Path d="M120 84 Q132 56 166 58 L170 66 Q144 66 136 84 Z" fill={c.upper} />
      <Rect x="44" y="66" width="10" height="8" rx="2" fill={colors.gold} />
    </G>
  );
}
