
'use client';

import { useState, useEffect, useCallback, useMemo, startTransition } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { PlusCircle, Trash2, Search } from 'lucide-react';
import type { Article, Project, MaterialConsumption, ArticleGroup, MaterialOrder } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { getProject } from '@/services/projectService';
import { getMaterialOrdersForProject, saveMaterialOrder } from '@/services/materialOrderService';
import { getArticles } from '@/services/articleService';
import { getArticleGroups } from '@/services/articleGroupService';
import { Skeleton } from '../ui/skeleton';

const formatCurrency = (value: number) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);

export function ProjectMaterials({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [materials, setMaterials] = useState<MaterialOrder[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [articleGroups, setArticleGroups] = useState<ArticleGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const [newItemArticleId, setNewItemArticleId] = useState<string>('');
  const [quickAddArticleNumber, setQuickAddArticleNumber] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [projectData, materialsData, articlesData, articleGroupsData] = await Promise.all([
        getProject(projectId),
        getMaterialOrdersForProject(projectId),
        getArticles(),
        getArticleGroups(),
      ]);
      setProject(projectData);
      setMaterials(materialsData);
      setArticles(articlesData);
      setArticleGroups(articleGroupsData);
    } catch (error) {
      console.error("Failed to fetch project materials:", error);
      toast({ title: "Fehler beim Laden", description: "Projektdaten konnten nicht geladen werden.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addArticle = useCallback(async (article: Article) => {
    try {
      const newConsumption: Omit<MaterialOrder, 'id' | 'createdAt' | 'submittedAt' | 'employeeId'> = {
        projectId,
        items: [{
          articleId: article.id,
          quantity: 1,
        }],
        status: 'draft',
      };
      const savedConsumption = await saveMaterialOrder(null, newConsumption, '');
      setMaterials(prev => [...prev, savedConsumption]);
      toast({ title: "Material hinzugefügt", description: `"${article.name}" wurde zur Liste hinzugefügt.` });
    } catch (error) {
      console.error("Failed to add material:", error);
      toast({ title: "Fehler", description: "Material konnte nicht hinzugefügt werden.", variant: "destructive" });
    }
  }, [projectId, toast]);

  const addNewItem = useCallback(() => {
    if (!newItemArticleId) return;
    const article = articles.find(a => a.id === newItemArticleId);
    if (!article) return;
    addArticle(article);
    setNewItemArticleId('');
  }, [articles, newItemArticleId, addArticle]);

  const handleQuickAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const article = articles.find(a => a.articleNumber === quickAddArticleNumber);
      if (article) {
        addArticle(article);
        setQuickAddArticleNumber('');
      } else {
        toast({ title: "Fehler", description: "Artikel mit dieser Nummer nicht gefunden.", variant: "destructive" });
      }
    }
  };

  const handleRemoveItem = async (consumptionId: string) => {
    // try {
    //     await deleteMaterialConsumption(consumptionId);
    //     setMaterials(prev => prev.filter(m => m.id !== consumptionId));
    //     toast({ title: "Material entfernt", description: "Der Eintrag wurde gelöscht." });
    // } catch (error) {
    //     console.error("Failed to remove material:", error);
    //     toast({ title: "Fehler", description: "Eintrag konnte nicht gelöscht werden.", variant: "destructive" });
    // }
  };

  const groupedArticles = useMemo(() => {
    // Group articles by article.groupId and expose them under the ArticleGroup name
    const groupIdToName = new Map(articleGroups.map(g => [g.id, g.name]));
    const groupNameToArticles: Record<string, Article[]> = {};

    // Initialize groups
    articleGroups.forEach(g => {
      groupNameToArticles[g.name] = [];
    });
    groupNameToArticles['Unkategorisiert'] = [];

    const sortedArticles = [...articles].sort((a, b) => a.name.localeCompare(b.name));
    sortedArticles.forEach(article => {
      const groupName = groupIdToName.get(article.groupId) || 'Unkategorisiert';
      if (!groupNameToArticles[groupName]) groupNameToArticles[groupName] = [];
      groupNameToArticles[groupName].push(article);
    });

    Object.keys(groupNameToArticles).forEach(key => {
      if (groupNameToArticles[key].length === 0) delete groupNameToArticles[key];
    });

    return groupNameToArticles;
  }, [articles, articleGroups]);

  const articlesMap = useMemo(() => new Map(articles.map(a => [a.id, a])), [articles]);

  const filteredMaterials = useMemo(() => {
    const s = searchTerm.trim().toLowerCase();
    // Always return a flat list of item entries with an attached `order` object to keep shape consistent
    if (!s) {
      return materials.flatMap(order => order.items.map(it => ({ ...it, order })));
    }
    return materials.flatMap(order => order.items.filter(item => {
      const article = articlesMap.get(item.id);
      const name = article?.name?.toLowerCase() || '';
      const number = article?.articleNumber?.toLowerCase() || '';
      return name.includes(s) || number.includes(s);
    }).map(it => ({ ...it, order })));
  }, [materials, articlesMap, searchTerm]);

  if (loading) {
    return <Card><CardHeader><Skeleton className="h-8 w-64" /></CardHeader><CardContent><Skeleton className="h-64 w-full" /></CardContent></Card>
  }

  if (!project) {
    return <Card><CardHeader><CardTitle>Projekt nicht gefunden</CardTitle></CardHeader></Card>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Materialliste für Projekt {project.projectNumber}</CardTitle>
        <CardDescription>{project.projectName}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Suche Artikelname oder Artikel-Nr..."
              className="w-full pl-8"
              value={searchTerm}
              onChange={(e) => startTransition(() => setSearchTerm(e.target.value))}
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Artikel</TableHead>
              <TableHead className="w-24">Menge</TableHead>
              <TableHead className="w-24">Einheit</TableHead>
              <TableHead className="w-32 text-right">Verbrauch am</TableHead>
              <TableHead className="w-12"><span className="sr-only">Aktion</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMaterials.map((entry, idx) => {
              const article = articlesMap.get(entry.id);
              const order = (entry as any).order as MaterialOrder;
              return (
                <TableRow key={`${entry.id}-${idx}`}>
                  <TableCell>{article?.name || 'Unbekannter Artikel'}</TableCell>
                  <TableCell>
                    <Input type="number" defaultValue={entry.quantity} />
                  </TableCell>
                  <TableCell>{article?.unit || 'Stk'}</TableCell>
                  <TableCell className="text-right">
                    {order?.createdAt ? new Date(order.createdAt).toLocaleDateString('de-DE') : '—'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(order.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4 border-t pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div>
            <h3 className="font-semibold mb-2">Per Dropdown hinzufügen</h3>
            <div className="flex gap-2 w-full">
              <Select value={newItemArticleId} onValueChange={setNewItemArticleId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Artikel auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(groupedArticles).map(([groupName, articlesInGroup]) => (
                    <SelectGroup key={groupName}>
                      <SelectLabel>{groupName}</SelectLabel>
                      {articlesInGroup.map(a => <SelectItem key={a.id} value={a.id}>{a.articleNumber} - {a.name}</SelectItem>)}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={addNewItem} size="sm" className="gap-1" type="button">
                <PlusCircle className="h-4 w-4" /> Hinzufügen
              </Button>
            </div>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Schnelleingabe per Artikelnummer</h3>
            <Input
              placeholder="Artikelnummer eingeben..."
              value={quickAddArticleNumber}
              onChange={e => setQuickAddArticleNumber(e.target.value)}
              onKeyDown={handleQuickAdd}
            />
            <p className="text-xs text-muted-foreground mt-1">Artikelnummer eingeben und mit Enter bestätigen.</p>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
