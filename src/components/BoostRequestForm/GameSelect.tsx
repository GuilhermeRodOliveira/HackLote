type Props = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
};

export default function GameSelect({ value, onChange }: Props) {
  return (
    <select className="input" value={value} onChange={onChange} required>
      <option value="">Selecione o jogo</option>
      <option value="League of Legends">League of Legends</option>
      <option value="Valorant">Valorant</option>
      <option value="CS2">CS2</option>
      <option value="Fortnite">Fortnite</option>
      <option value="Fortnite">Rocket League</option>
    </select>
  );
}
