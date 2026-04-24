import { cn } from "@/lib/cn";
import type { Product } from "@/lib/schemas";

export interface SpecsTableProps {
  attributes: Product["attributes"];
  className?: string;
}

interface Row {
  label: string;
  value: string;
}

function buildRows(attributes: Product["attributes"]): Row[] {
  if (!attributes) return [];
  const rows: Row[] = [];

  if (attributes.material) {
    rows.push({ label: "Material", value: String(attributes.material) });
  }
  if (attributes.formats && attributes.formats.length > 0) {
    rows.push({ label: "Formats", value: attributes.formats.join(", ") });
  }
  if (attributes.finishes && attributes.finishes.length > 0) {
    rows.push({ label: "Finishes", value: attributes.finishes.map(String).join(", ") });
  }
  if (attributes.thicknesses && attributes.thicknesses.length > 0) {
    rows.push({
      label: "Thickness",
      value: attributes.thicknesses.map((t) => `${t}mm`).join(", "),
    });
  }
  if (attributes.slipRating) {
    rows.push({ label: "Slip rating", value: String(attributes.slipRating) });
  }
  if (attributes.waterAbsorption) {
    rows.push({ label: "Water absorption", value: String(attributes.waterAbsorption) });
  }
  if (typeof attributes.rectified === "boolean") {
    rows.push({ label: "Rectified", value: attributes.rectified ? "Yes" : "No" });
  }
  if (attributes.colours && attributes.colours.length > 0) {
    rows.push({ label: "Colours", value: attributes.colours.join(", ") });
  }

  return rows;
}

export function SpecsTable({ attributes, className }: SpecsTableProps) {
  const rows = buildRows(attributes);
  if (rows.length === 0) return null;

  return (
    <table className={cn("w-full border-collapse text-sm", className)}>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="border-b border-line last:border-b-0">
            <th
              scope="row"
              className={cn(
                "py-space-3 pr-space-4 text-left align-top",
                "font-sans font-medium text-ink-muted",
                "w-[200px] uppercase tracking-wider text-xs",
              )}
            >
              {row.label}
            </th>
            <td className="py-space-3 align-top text-ink">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
