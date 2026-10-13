import { Chip } from '@/components/ui/Chip';

export type VocabSet = {
  /** Value of the `?set=` query parameter, for example `3-4`. */
  param: string;
  label: string;
};

type SetSwitchProps = {
  sets: VocabSet[];
  activeParam: string;
  onChange: (param: string) => void;
};

/** Chapter-set switch: large coral chips; the active fill slides between them. */
export function SetSwitch({ sets, activeParam, onChange }: SetSwitchProps) {
  return (
    <div
      role="group"
      aria-label="เลือกชุดบทเรียน"
      className="grid grid-cols-2 gap-3 sm:flex sm:justify-center"
    >
      {sets.map((set) => (
        <Chip
          key={set.param}
          layoutId="set-chip"
          active={set.param === activeParam}
          onClick={() => onChange(set.param)}
        >
          {set.label}
        </Chip>
      ))}
    </div>
  );
}
