import React from 'react';

type CardGroupProps = {
  title: string;
  items: string[];
};

const CardGroup = ({ title, items }: CardGroupProps) => {
  return (
    <div className="bg-[#1c1f2e]/70 backdrop-blur border border-yellow-500/20 rounded-2xl p-6 shadow-lg hover:shadow-yellow-500/40 transition duration-300">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <ul className="space-y-2 text-sm text-gray-300">
        {items.map((item, index) => (
          <li
            key={index}
            className="hover:text-yellow-400 cursor-pointer transition duration-200"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CardGroup;
