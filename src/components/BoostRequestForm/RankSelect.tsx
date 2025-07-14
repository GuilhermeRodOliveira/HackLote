type Props = {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function RankSelect({ label, value, onChange }: Props) {
  return (
    <input
      className="input"
      type="text"
      placeholder={label}
      value={value}
      onChange={onChange}
      required
    />
  );
}
