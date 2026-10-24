import { useState } from "react";
import { PaletteIcon, Check } from "lucide-react";
import { useThemeStore } from "../store/useThemeStore";
import { THEMES } from "../constants";

const ThemeSelector = ({ placement = "bottom" }) => {
  const { theme, setTheme } = useThemeStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="btn btn-ghost btn-circle"
        aria-label="Select theme"
      >
        <PaletteIcon className="size-5" />
      </button>

      {open && (
        <div
          className={`absolute right-0 left-0 z-[100] max-h-80 w-56 overflow-y-auto rounded-xl border border-base-300 bg-base-200 p-2 shadow-2xl  ${
            placement === "top" ? "bottom-full mb-5 " : "top-full mt-3"
          }`}
        >
          {THEMES.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => {
                setTheme(item.name);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 rounded-lg p-3 ${
                theme === item.name
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-base-300"
              }`}
            >
              <PaletteIcon className="size-4" />

              <span className="flex-1 text-left text-sm">{item.label}</span>

              <div className="flex gap-1">
                {item.colors.map((color, index) => (
                  <span
                    key={index}
                    className="size-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {theme === item.name && <Check className="size-4" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
