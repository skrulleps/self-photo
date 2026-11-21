import { FILTER_IDS, FILTERS, matrixValues, type FilterId } from "@/lib/render/filters";

// filter CSS buat preview. Isinya matrix yang sama dengan yang dihitung saat jepret (lib/render/filters.ts).
export const filterCss = (id: FilterId) => (FILTERS[id] ? `url(#filter-${id})` : "none");

// definisi SVG-nya cukup sekali di halaman. sRGB biar hitungannya sama dengan perhitungan per pixel di canvas.
export default function FilterDefs() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="absolute">
      <defs>
        {FILTER_IDS.map((id) => {
          const m = FILTERS[id];
          return m && (
            <filter key={id} id={`filter-${id}`} colorInterpolationFilters="sRGB">
              <feColorMatrix type="matrix" values={matrixValues(m)} />
            </filter>
          );
        })}
      </defs>
    </svg>
  );
}
