import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import AdminMessengerBadge from "./admin/AdminMessengerBadge";
import { useProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const ProfileSettings = () => {
  const { profile, fetchProfile } = useProfile();
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) fetchProfile(user.id);
  }, [user]);

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
        })
        .eq('id', user.id);
      if (error) throw error;
      toast.success('Профиль успешно обновлён');
      fetchProfile(user.id);
    } catch (e) {
      toast.error('Ошибка при обновлении профиля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 max-w-xl">
      <div className="flex justify-end mb-4">
        {user && (
          <Link to="/messenger" className="relative group inline-flex items-center">
            <Mail className="h-6 w-6 text-primary group-hover:text-red-600 transition" />
            <AdminMessengerBadge userId={user.id}>
              {(count) => count > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-1.5 text-xs animate-pulse">{count}</span>
              )}
            </AdminMessengerBadge>
          </Link>
        )}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Настройки профиля</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="firstName">Имя</Label>
              <Input id="firstName" value={firstName} onChange={e => setFirstName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="lastName">Фамилия</Label>
              <Input id="lastName" value={lastName} onChange={e => setLastName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="phone">Телефон</Label>
              <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>Роль</Label>
              <Input value={profile?.role || ''} disabled readOnly />
            </div>
            <Tooltip>
  <TooltipTrigger asChild>
    <Button onClick={handleSave} disabled={loading} className="w-full mt-4" variant="ghost" size="lg" aria-label="Сохранить">
      <Check className="mr-2 h-5 w-5" />
      {loading ? 'Сохранение...' : 'Сохранить'}
    </Button>
  </TooltipTrigger>
  <TooltipContent>Сохранить</TooltipContent>
</Tooltip>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSettings;
