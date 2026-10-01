import React from 'react';
import { Plus, Trash2, Copy } from 'lucide-react';
import TextInput from './TextInput';
import NumberInput from './NumberInput';
import SelectInput from './SelectInput';

export default function EditableTable({ columns, rows, onChange, onAdd, onDelete, onDuplicate, emptyMessage }) {
  const handleChange = (id, key, val) => {
    onChange(rows.map(r => r.id === id ? { ...r, [key]: val } : r));
  };

  const handleKeyDown = (e, index, isLastCol) => {
    if (e.key === 'Enter' && isLastCol && index === rows.length - 1 && onAdd) {
      e.preventDefault();
      onAdd();
    }
  };

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-slate-200 shadow-sm bg-white">
      <table className="w-full text-left text-sm whitespace-nowrap min-w-max">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
          <tr>
            {columns.map(c => <th key={c.key} className="px-4 py-3 font-medium" style={{width: c.width}}>{c.label}</th>)}
            <th className="px-4 py-3 w-16 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-500">{emptyMessage}</td></tr>
          ) : rows.map((r, rowIndex) => (
            <tr key={r.id} className="hover:bg-slate-50 transition-colors">
              {columns.map((c, colIndex) => {
                const isLastCol = colIndex === columns.length - 1;
                return (
                  <td key={c.key} className="px-4 py-2" onKeyDown={(e) => handleKeyDown(e, rowIndex, isLastCol)}>
                    {c.type === 'text' && <TextInput value={r[c.key]} onChange={(v) => handleChange(r.id, c.key, v)} className="py-1.5 px-2 text-sm" placeholder={c.placeholder} error={c.error && c.error(r)} list={c.listId} disabled={typeof c.disabled === 'function' ? c.disabled(r) : c.disabled} />}
                    {c.type === 'number' && <NumberInput value={r[c.key]} onChange={(v) => handleChange(r.id, c.key, v)} prefix={typeof c.prefix === 'function' ? c.prefix(r) : c.prefix} suffix={typeof c.suffix === 'function' ? c.suffix(r) : c.suffix} min={typeof c.min === 'function' ? c.min(r) : c.min} max={typeof c.max === 'function' ? c.max(r) : c.max} className="py-1.5 px-2 text-sm" placeholder={c.placeholder} error={c.error && c.error(r)} disabled={typeof c.disabled === 'function' ? c.disabled(r) : c.disabled} />}
                    {c.type === 'select' && <SelectInput value={r[c.key]} options={c.options} onChange={(v) => handleChange(r.id, c.key, v)} className="py-1.5 px-2 text-sm" error={c.error && c.error(r)} disabled={typeof c.disabled === 'function' ? c.disabled(r) : c.disabled} />}
                    {c.type === 'checkbox' && <input type="checkbox" checked={!!r[c.key]} onChange={(e) => handleChange(r.id, c.key, e.target.checked)} className={`w-4 h-4 text-navy-600 rounded border-slate-300 focus:ring-navy-500 ${c.error && c.error(r) ? 'border-red-400' : ''}`} disabled={typeof c.disabled === 'function' ? c.disabled(r) : c.disabled} />}
                  </td>
                );
              })}
              <td className="px-4 py-2 text-right space-x-3">
                {onDuplicate && <button onClick={() => onDuplicate(r)} className="text-slate-400 hover:text-blue-500 transition-colors" title="Duplicate"><Copy className="w-4 h-4 inline" /></button>}
                {onDelete && <button onClick={() => onDelete(r.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Delete"><Trash2 className="w-4 h-4 inline" /></button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {onAdd && (
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
          <button onClick={onAdd} className="inline-flex items-center text-sm font-medium text-navy-600 hover:text-navy-800 transition-colors">
            <Plus className="w-4 h-4 mr-1" /> Add Row
          </button>
        </div>
      )}
    </div>
  );
}
