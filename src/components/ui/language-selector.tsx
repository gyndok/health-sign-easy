import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const languages = [
  { code: "en", label: "English" },
  { code: "es", label: "Espa\u00f1ol" },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem("cc_language", code);
  };

  return (
    <Select value={i18n.language} onValueChange={handleChange}>
      <SelectTrigger className="w-auto h-8 gap-1.5 text-xs border-none bg-secondary/50 hover:bg-secondary px-2.5">
        <Globe className="h-3.5 w-3.5" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code} className="text-xs">
            {lang.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
