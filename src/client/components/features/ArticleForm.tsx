import React, { useEffect, useState } from 'react';
import type { Article } from '@/shared/types';
import { getArticles } from '@/services/articleService';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';

export type ArticleFormPayload = {
    articleNumber: string;
    group: string;
    name: string;
    description: string;
    longText?: string;
    grossPurchasePrice: number;
    netPurchasePrice: number;
    grossSalesPrice: number;
    netSalesPrice: number;
    bhrEur: number;
    bhrPercent: number;
    unit: string;
    status?: string;
};

type ArticleFormProps = {
    onSave: (article: ArticleFormPayload) => void;
    loading?: boolean;
    initialData?: Partial<Article>;
};

function calcNet(price: number) {
    // 19% MwSt
    return +(price / 1.19).toFixed(2);
}

function calcBHR(netSales: number, netPurchase: number) {
    const bhrEur = +(netSales - netPurchase).toFixed(2);
    const bhrPercent = netSales > 0 ? +(100 * (netSales - netPurchase) / netSales).toFixed(2) : 0;
    return { bhrEur, bhrPercent };
}

export default function ArticleForm({ onSave, loading, initialData }: ArticleFormProps) {
    const [articleNumber, setArticleNumber] = useState(initialData?.articleNumber || '');
    const [group, setGroup] = useState(initialData?.group || '');
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [longText, setLongText] = useState(initialData?.longText || '');
    const [grossPurchasePrice, setGrossPurchasePrice] = useState(initialData?.grossPurchasePrice?.toString().replace('.', ',') || '');
    const [grossSalesPrice, setGrossSalesPrice] = useState(initialData?.grossSalesPrice?.toString().replace('.', ',') || '');
    const [unit, setUnit] = useState(initialData?.unit || 'Stk');
    const [status, setStatus] = useState(initialData?.status || 'Aktiv');

    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
    const [templateSearchTerm, setTemplateSearchTerm] = useState('');
    const [allArticles, setAllArticles] = useState<Article[]>([]);

    useEffect(() => {
        const fetchArticles = async () => {
            const articles = await getArticles();
            setAllArticles(articles);
        };
        fetchArticles();
    }, [getArticles]);

    useEffect(() => {
        if (!initialData) return;
        setArticleNumber(initialData.articleNumber || '');
        setGroup(initialData.group || '');
        setName(initialData.name || '');
        setDescription(initialData.description || '');
        setLongText(initialData.longText || '');
        setGrossPurchasePrice(initialData.grossPurchasePrice?.toString().replace('.', ',') || '');
        setGrossSalesPrice(initialData.grossSalesPrice?.toString().replace('.', ',') || '');
        setUnit(initialData.unit || 'Stk');
        setStatus(initialData.status || 'Aktiv');
    }, [initialData]);

    const handleSelectTemplate = (templateArticle: Article) => {
        setGroup(templateArticle.group || '');
        setName(templateArticle.name || '');
        setDescription(templateArticle.description || '');
        setLongText(templateArticle.longText || '');
        setGrossPurchasePrice('');
        setGrossSalesPrice('');
        setIsTemplateDialogOpen(false);
    };

    // KI-Vorschlag für Verkaufspreis basierend auf Online-Marktpreisen
    const handleKISuggest = async () => {
        if (!name.trim()) {
            alert('Bitte geben Sie zuerst einen Artikelnamen ein.');
            return;
        }

        try {
            const response = await fetch('/api/articles/suggest-price', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name,
                    description,
                    group,
                }),
            });

            if (!response.ok) {
                throw new Error('Preisvorschlag konnte nicht abgerufen werden');
            }

            const data = await response.json();
            
            if (data.suggestedNetPrice) {
                // Netto zu Brutto umrechnen (19% MwSt)
                const suggestedGrossPrice = +(data.suggestedNetPrice * 1.19).toFixed(2);
                setGrossSalesPrice(suggestedGrossPrice.toString().replace('.', ','));
            }
        } catch (error) {
            console.error('Fehler beim Abrufen des KI-Preisvorschlags:', error);
            alert('Fehler beim Abrufen des Preisvorschlags. Bitte versuchen Sie es später erneut.');
        }
    };

    // Umwandlung und Berechnung
    const grossPurchase = parseFloat(grossPurchasePrice.replace(',', '.')) || 0;
    const grossSales = parseFloat(grossSalesPrice.replace(',', '.')) || 0;
    const netPurchase = calcNet(grossPurchase);
    const netSales = calcNet(grossSales);
    const { bhrEur, bhrPercent } = calcBHR(netSales, netPurchase);

    const bhrColor =
        bhrPercent > 30 ? 'text-green-600' :
            bhrPercent < 10 ? 'text-red-600' : 'text-yellow-600';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || grossPurchase <= 0 || grossSales <= 0) return;
        onSave({
            articleNumber,
            group,
            name,
            description,
            longText,
            grossPurchasePrice: grossPurchase,
            netPurchasePrice: netPurchase,
            grossSalesPrice: grossSales,
            netSalesPrice: netSales,
            bhrEur,
            bhrPercent,
            unit,
            status,
        });
        setName('');
        setDescription('');
        setLongText('');
        setGrossPurchasePrice('');
        setGrossSalesPrice('');
        setUnit('Stk');
    };

    const templateArticles = allArticles.filter(article =>
        article.name.toLowerCase().includes(templateSearchTerm.toLowerCase())
    );

    return (
        <>
            <form className="max-w-lg mx-auto bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4" onSubmit={handleSubmit}>
            <h2 className="text-xl font-bold mb-2">Neuen Artikel anlegen</h2>
            <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                    type="text"
                    className="mt-1 block w-full border rounded-md p-2"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Beschreibung</label>
                <textarea
                    className="mt-1 block w-full border rounded-md p-2"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Langtext / Details</label>
                <textarea
                    className="mt-1 block w-full border rounded-md p-2"
                    value={longText}
                    onChange={e => setLongText(e.target.value)}
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Brutto Einkaufspreis (€)</label>
                    <input
                        type="text"
                        className="mt-1 block w-full border rounded-md p-2"
                        value={grossPurchasePrice}
                        onChange={e => setGrossPurchasePrice(e.target.value.replace('.', ','))}
                        pattern="^\d{1,3}(?:\.\d{3})*(?:,\d{2})?$"
                        required
                    />
                    <div className="text-xs text-gray-500 mt-1">Netto: {netPurchase.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Brutto Verkaufspreis (€)</label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="mt-1 block w-full border rounded-md p-2"
                            value={grossSalesPrice}
                            onChange={e => setGrossSalesPrice(e.target.value.replace('.', ','))}
                            pattern="^\d{1,3}(?:\.\d{3})*(?:,\d{2})?$"
                            required
                        />
                        <button
                            type="button"
                            className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs mt-1"
                            onClick={handleKISuggest}
                            title="KI-Preisvorschlag holen"
                        >
                            KI
                        </button>
                        <button
                            type="button"
                            className="bg-gray-600 text-white px-3 py-1 rounded-md text-xs mt-1"
                            onClick={() => setIsTemplateDialogOpen(true)}
                            title="Artikel aus Vorlage erstellen"
                        >
                            Vorlage
                        </button>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Netto: {netSales.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">BHR (EUR)</label>
                    <div className={`mt-1 font-bold ${bhrColor}`}>{bhrEur.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">BHR (%)</label>
                    <div className={`mt-1 font-bold ${bhrColor}`}>{bhrPercent.toLocaleString('de-DE', { minimumFractionDigits: 2 })} %</div>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Mengeneinheit</label>
                <select
                    className="mt-1 block w-full border rounded-md p-2"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                >
                    <option value="Stk">Stück</option>
                    <option value="kg">Kilogramm</option>
                    <option value="m">Meter</option>
                    <option value="h">Stunde</option>
                </select>
            </div>
            <button
                type="submit"
                className="w-full bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-primary-dark transition"
                disabled={loading}
            >
                {loading ? 'Speichern...' : 'Speichern'}
            </button>
        </form>
            <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Artikel aus Vorlage erstellen</DialogTitle>
                    </DialogHeader>
                    <div className="p-4">
                        <Input
                            placeholder="Vorlage suchen..."
                            value={templateSearchTerm}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateSearchTerm(e.target.value)}
                        />
                        <div className="mt-4 max-h-64 overflow-y-auto">
                            {templateArticles.map(article => (
                                <div
                                    key={article.id}
                                    className="p-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => handleSelectTemplate(article)}
                                >
                                    {article.name}
                                </div>
                            ))}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

