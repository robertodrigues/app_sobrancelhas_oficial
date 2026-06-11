87 | 
88 |         // Buscar atividades recentes filtrando por user_id
89 |         const { data: recent, error: recentError } = await supabase
90 |           .query("SELECT * FROM activities WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5", [userId])
91 | import Navbar from "@/components/layout/Navbar";
92 | import { Card, CardContent } from "@/components/ui/card";
93 | import { Button } from "@/components/ui/button";
94 | import { Plus, Users, FileText, Camera, Sparkles, Loader2, ChevronRight, LogOut, Upload } from "lucide-react";