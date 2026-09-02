import type { ReactNode } from 'react';
import type { MuscleGroup } from '../types';

/**
 * Simplified front/back figures. Each muscle group is one region keyed by its
 * MuscleGroup id, drawn as a blocky anatomical shape — legible at phone size
 * rather than anatomically precise.
 */
export interface BodyProps {
  fillFor: (muscle: MuscleGroup) => string;
  onSelect: (muscle: MuscleGroup) => void;
  selected: MuscleGroup | null;
}

const VIEW_BOX = '0 0 200 470';

/** Skin/outline colours for the non-interactive parts of the figure. */
const OUTLINE = '#2b3a4d';
const INERT = '#1b242f';

function Region({
  muscle,
  children,
  fillFor,
  onSelect,
  selected,
}: BodyProps & { muscle: MuscleGroup; children: ReactNode }) {
  const isSelected = selected === muscle;
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={muscle}
      onClick={() => onSelect(muscle)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(muscle);
        }
      }}
      className="cursor-pointer outline-none transition-opacity hover:opacity-80"
      fill={fillFor(muscle)}
      stroke={isSelected ? '#f8fafc' : OUTLINE}
      strokeWidth={isSelected ? 2.5 : 1}
    >
      {children}
    </g>
  );
}

/** Head, neck, hands and feet — drawn but not trackable. */
function Inert({ back = false }: { back?: boolean }) {
  return (
    <g fill={INERT} stroke={OUTLINE} strokeWidth={1}>
      <circle cx={100} cy={34} r={21} />
      <path d="M88,50 L88,66 Q100,74 112,66 L112,50 Z" />
      {/* hands */}
      <ellipse cx={47} cy={205} rx={9} ry={12} />
      <ellipse cx={153} cy={205} rx={9} ry={12} />
      {/* feet */}
      <ellipse cx={86} cy={382} rx={10} ry={9} />
      <ellipse cx={114} cy={382} rx={10} ry={9} />
      {/* knees / joints */}
      {!back && (
        <>
          <ellipse cx={87} cy={308} rx={11} ry={8} />
          <ellipse cx={113} cy={308} rx={11} ry={8} />
        </>
      )}
    </g>
  );
}

export function BodyFront(props: BodyProps) {
  return (
    <svg viewBox={VIEW_BOX} className="h-full w-full" aria-label="Front of body">
      <Inert />
      <Region {...props} muscle="traps">
        <path d="M80,66 Q100,58 120,66 L136,86 Q100,74 64,86 Z" />
      </Region>
      <Region {...props} muscle="side-delts">
        <ellipse cx={51} cy={98} rx={11} ry={15} />
        <ellipse cx={149} cy={98} rx={11} ry={15} />
      </Region>
      <Region {...props} muscle="front-delts">
        <ellipse cx={64} cy={94} rx={14} ry={16} />
        <ellipse cx={136} cy={94} rx={14} ry={16} />
      </Region>
      <Region {...props} muscle="chest">
        <path d="M72,86 Q87,80 98,90 L98,128 Q78,132 69,114 Q66,98 72,86 Z" />
        <path d="M128,86 Q113,80 102,90 L102,128 Q122,132 131,114 Q134,98 128,86 Z" />
      </Region>
      <Region {...props} muscle="biceps">
        <ellipse cx={59} cy={128} rx={11} ry={23} />
        <ellipse cx={141} cy={128} rx={11} ry={23} />
      </Region>
      <Region {...props} muscle="forearms">
        <ellipse cx={50} cy={175} rx={9.5} ry={25} />
        <ellipse cx={150} cy={175} rx={9.5} ry={25} />
      </Region>
      <Region {...props} muscle="obliques">
        <path d="M75,136 L86,136 L86,204 L79,202 Q70,174 75,136 Z" />
        <path d="M125,136 L114,136 L114,204 L121,202 Q130,174 125,136 Z" />
      </Region>
      <Region {...props} muscle="abs">
        <path d="M88,134 L112,134 L112,196 Q100,208 88,196 Z" />
      </Region>
      <Region {...props} muscle="quads">
        <path d="M75,212 L98,212 L97,300 L79,300 Q70,258 75,212 Z" />
        <path d="M125,212 L102,212 L103,300 L121,300 Q130,258 125,212 Z" />
      </Region>
      <Region {...props} muscle="calves">
        <ellipse cx={87} cy={342} rx={11} ry={30} />
        <ellipse cx={113} cy={342} rx={11} ry={30} />
      </Region>
    </svg>
  );
}

export function BodyBack(props: BodyProps) {
  return (
    <svg viewBox={VIEW_BOX} className="h-full w-full" aria-label="Back of body">
      <Inert back />
      <Region {...props} muscle="traps">
        <path d="M100,58 L132,82 L118,132 L100,122 L82,132 L68,82 Z" />
      </Region>
      <Region {...props} muscle="rear-delts">
        <ellipse cx={62} cy={96} rx={14} ry={16} />
        <ellipse cx={138} cy={96} rx={14} ry={16} />
      </Region>
      <Region {...props} muscle="side-delts">
        <ellipse cx={50} cy={100} rx={10} ry={14} />
        <ellipse cx={150} cy={100} rx={10} ry={14} />
      </Region>
      <Region {...props} muscle="lats">
        <path d="M67,102 L84,128 L92,174 L74,166 Q61,134 67,102 Z" />
        <path d="M133,102 L116,128 L108,174 L126,166 Q139,134 133,102 Z" />
      </Region>
      <Region {...props} muscle="lower-back">
        <path d="M87,138 L113,138 L112,204 L88,204 Z" />
      </Region>
      <Region {...props} muscle="triceps">
        <ellipse cx={59} cy={128} rx={11} ry={23} />
        <ellipse cx={141} cy={128} rx={11} ry={23} />
      </Region>
      <Region {...props} muscle="forearms">
        <ellipse cx={50} cy={175} rx={9.5} ry={25} />
        <ellipse cx={150} cy={175} rx={9.5} ry={25} />
      </Region>
      <Region {...props} muscle="glutes">
        <path d="M78,206 Q90,200 99,208 L99,246 Q84,252 77,234 Q74,218 78,206 Z" />
        <path d="M122,206 Q110,200 101,208 L101,246 Q116,252 123,234 Q126,218 122,206 Z" />
      </Region>
      <Region {...props} muscle="hamstrings">
        <path d="M78,250 L98,250 L97,304 L80,304 Q74,278 78,250 Z" />
        <path d="M122,250 L102,250 L103,304 L120,304 Q126,278 122,250 Z" />
      </Region>
      <Region {...props} muscle="calves">
        <ellipse cx={87} cy={342} rx={11} ry={30} />
        <ellipse cx={113} cy={342} rx={11} ry={30} />
      </Region>
    </svg>
  );
}
