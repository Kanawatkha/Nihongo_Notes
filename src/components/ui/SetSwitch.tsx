import { Chip } from '@/components/ui/Chip';

export type SwitchSet = {
  /** Value of the `?set=` query parameter, for example `3-4`. */
  param: string;
  label: string;
};

type SetSwitchProps = {
  sets: SwitchSet[];
  /** Selected `param`, or null while nothing is chosen. */
  activeParam: string | null;
  onChange: (param: string) => void;
  /** Accessible name of the group. */
  label: string;
};

/** Set switch: large coral chips in the given order; the active fill slides between them. */
export function SetSwitch({ sets, activeParam, onChange, label }: SetSwitchProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:justify-center"
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
