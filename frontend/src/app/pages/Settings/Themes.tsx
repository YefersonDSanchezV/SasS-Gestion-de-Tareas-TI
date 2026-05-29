import { useTheme } from '../../context/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Check, Palette } from 'lucide-react';

export default function Themes() {
  const { currentTheme, setTheme, availableThemes } = useTheme();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-[#1E3A8A]">Personalización de Temas</h1>
        <p className="text-slate-500 text-sm">Elige el estilo visual que mejor se adapte a tu trabajo</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableThemes.map((theme) => {
          const isActive = currentTheme === theme.name;
          
          return (
            <Card 
              key={theme.name}
              className={`cursor-pointer transition-all duration-300 border-2 ${
                isActive ? 'border-[#3B82F6] shadow-xl scale-[1.02]' : 'border-transparent hover:border-slate-200'
              }`}
              onClick={() => setTheme(theme.name)}
            >
              <CardHeader className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="h-8 w-8 rounded-full border shadow-sm flex items-center justify-center"
                      style={{ backgroundColor: theme.colors.primary }}
                    >
                      <Palette size={16} className="text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-800">{theme.name}</CardTitle>
                  </div>
                  {isActive && (
                    <div className="bg-[#3B82F6] text-white p-1 rounded-full">
                      <Check size={14} />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Preview Bars */}
                  <div className="space-y-2">
                    <div className="h-4 w-full rounded-full opacity-20" style={{ backgroundColor: theme.colors.primary }}></div>
                    <div className="h-4 w-3/4 rounded-full opacity-20" style={{ backgroundColor: theme.colors.secondary }}></div>
                  </div>
                  
                  {/* Color Swatches */}
                  <div className="flex gap-2">
                    <div className="h-10 flex-1 rounded-lg shadow-inner" style={{ backgroundColor: theme.colors.primary }} title="Primario"></div>
                    <div className="h-10 flex-1 rounded-lg shadow-inner" style={{ backgroundColor: theme.colors.secondary }} title="Secundario"></div>
                    <div className="h-10 flex-1 rounded-lg shadow-inner border" style={{ backgroundColor: theme.colors.background }} title="Fondo"></div>
                    <div className="h-10 flex-1 rounded-lg shadow-inner" style={{ backgroundColor: theme.colors.sidebar }} title="Sidebar"></div>
                  </div>

                  <Button 
                    className={`w-full font-bold rounded-xl ${
                      isActive ? 'bg-[#3B82F6]' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {isActive ? 'Aplicado' : 'Seleccionar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
