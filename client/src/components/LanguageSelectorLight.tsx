import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { SUPPORTED_LANGUAGES, LanguageCode } from "@/lib/translation";

export function LanguageSelectorLight() {
  const { currentLanguage, setLanguage } = useLanguage();

  const currentLang = SUPPORTED_LANGUAGES[currentLanguage];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost"
          size="sm"
          data-testid="button-language-selector"
          className="gap-1 text-white hover:text-white hover:bg-white/20 text-xs px-1.5 py-0.5 h-7"
        >
          <span className="text-[10px]">{currentLang.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => setLanguage(code as LanguageCode)}
            className={currentLanguage === code ? "bg-accent" : ""}
            data-testid={`language-option-${code}`}
          >
            <span className="mr-2">{lang.flag}</span>
            <span>{lang.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
