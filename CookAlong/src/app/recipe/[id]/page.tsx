"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  ChefHat,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Edit3,
  Trash2,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecipeStepper } from "@/components/RecipeStepper";
import { TimerDisplay } from "@/components/TimerDisplay";
import { formatDuration, formatDifficulty, formatQuantity } from "@/lib/formatters";
import { smartConvert, isVolumeUnit, isWeightUnit } from "@/lib/unitConverter";
import { unitLabels, findDensity } from "@/data/densityDatabase";
import { getRecipeById } from "@/data/recipes";
import { Recipe, Ingredient, PersonalNote, RecipeStep } from "@/types";
import { 
  getNotesByRecipe, 
  addNote, 
  updateNote, 
  deleteNote,
  addAdjustment,
  getAdjustmentsByRecipe,
  markRecipeViewed,
  cacheRecipe
} from "@/lib/indexedDB";
import { useTimer } from "@/hooks/useTimer";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { cn } from "@/lib/utils";

export default function RecipeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const recipeId = params.id as string;
  
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [notes, setNotes] = useState<PersonalNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [activeTab, setActiveTab] = useState("steps");
  const [showIngredientConverter, setShowIngredientConverter] = useState<Ingredient | null>(null);
  const [convertedUnit, setConvertedUnit] = useState<string>("gram");
  const [convertedValue, setConvertedValue] = useState<number>(0);

  const {
    timers,
    createTimer,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    resetTimer,
  } = useTimer();

  const { isSupported: speechSupported } = useSpeechSynthesis();

  useEffect(() => {
    const recipeData = getRecipeById(recipeId);
    if (recipeData) {
      setRecipe(recipeData);
      markRecipeViewed(recipeId);
      cacheRecipe(recipeData);
    }

    async function loadNotes() {
      try {
        const recipeNotes = await getNotesByRecipe(recipeId);
        setNotes(recipeNotes);
      } catch (error) {
        console.error("Failed to load notes:", error);
      }
    }
    loadNotes();
  }, [recipeId]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      const note = await addNote({
        recipeId,
        content: newNote.trim(),
      });
      setNotes(prev => [...prev, note]);
      setNewNote("");
    } catch (error) {
      console.error("Failed to add note:", error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      setNotes(prev => prev.filter(n => n.id !== noteId));
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const handleConvertIngredient = (ingredient: Ingredient) => {
    setShowIngredientConverter(ingredient);
    
    const targetUnit = isVolumeUnit(ingredient.unit) ? "gram" : "cup";
    setConvertedUnit(targetUnit);
    
    const converted = smartConvert(
      ingredient.quantity,
      ingredient.unit,
      targetUnit,
      ingredient.name
    );
    setConvertedValue(converted);
  };

  const toggleUnit = () => {
    if (!showIngredientConverter) return;
    
    const newUnit = convertedUnit === "gram" ? "cup" : "gram";
    setConvertedUnit(newUnit);
    
    const converted = smartConvert(
      showIngredientConverter.quantity,
      showIngredientConverter.unit,
      newUnit,
      showIngredientConverter.name
    );
    setConvertedValue(converted);
  };

  const handleStepComplete = (step: RecipeStep) => {
    console.log("Step completed:", step);
  };

  const handleRecipeComplete = () => {
    console.log("Recipe completed!");
  };

  const formatIngredient = (ingredient: Ingredient) => {
    if (ingredient.unit === "piece") {
      return `${ingredient.quantity} ${ingredient.name}`;
    }
    return `${formatQuantity(ingredient.quantity, ingredient.unit)} ${ingredient.name}`;
  };

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-500">菜谱不存在</p>
          <Button
            variant="default"
            className="mt-4"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回首页
          </Button>
        </div>
      </div>
    );
  }

  const difficultyColors: Record<string, string> = {
    easy: "bg-green-100 text-green-700",
    medium: "bg-amber-100 text-amber-700",
    hard: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900 truncate">
            {recipe.title}
          </h1>
        </div>
      </header>

      {recipe.imageUrl && (
        <div className="relative h-56 overflow-hidden">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="flex items-center gap-3 text-white">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(recipe.prepTime + recipe.cookTime)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{recipe.servings} 人份</span>
              </div>
              <Badge className={cn(
                "bg-white/20 text-white border-0",
                difficultyColors[recipe.difficulty]
              )}>
                {formatDifficulty(recipe.difficulty)}
              </Badge>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-4">
        <p className="text-gray-600 text-lg mb-4">{recipe.description}</p>
        
        <div className="flex flex-wrap gap-2 mb-6">
          {recipe.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-base px-3 py-1">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-14">
            <TabsTrigger value="steps" className="text-base">
              步骤
            </TabsTrigger>
            <TabsTrigger value="ingredients" className="text-base">
              食材
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-base">
              笔记
            </TabsTrigger>
          </TabsList>

          <TabsContent value="steps" className="mt-6">
            <RecipeStepper
              steps={recipe.steps}
              onStepComplete={handleStepComplete}
              onComplete={handleRecipeComplete}
            />
          </TabsContent>

          <TabsContent value="ingredients" className="mt-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xl">食材清单</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {recipe.ingredients.map((ingredient) => (
                    <li
                      key={ingredient.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => handleConvertIngredient(ingredient)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full shrink-0" />
                        <span className="text-lg">{formatIngredient(ingredient)}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500"
                      >
                        换算
                      </Button>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-700">
                    💡 点击任意食材可查看杯/克换算（基于食材密度数据库）
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">添加笔记</h3>
              <div className="flex gap-3">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="记录您的烹饪心得、调整量或替代食材..."
                  className="flex-1 min-h-[100px] p-4 text-lg border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <Button
                variant="default"
                size="touch"
                className="w-full mt-3"
                onClick={handleAddNote}
                disabled={!newNote.trim()}
              >
                <Plus className="w-5 h-5 mr-2" />
                保存笔记
              </Button>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">
                我的笔记 ({notes.length})
              </h3>
              
              {notes.length > 0 ? (
                <div className="space-y-4">
                  {notes.map((note) => (
                    <Card key={note.id}>
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <p className="text-gray-700 text-lg leading-relaxed flex-1">
                            {note.content}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 ml-2 shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">
                          {new Date(note.updatedAt).toLocaleString('zh-CN')}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-8 text-center">
                  <Edit3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    还没有笔记，记录您的烹饪心得吧！
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {timers.length > 0 && (
        <div className="fixed bottom-20 left-4 right-4 max-w-2xl mx-auto z-40">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <h3 className="font-semibold text-blue-800 mb-3">
                运行中的计时器
              </h3>
              <div className="space-y-3">
                {timers.map((timer) => (
                  <TimerDisplay
                    key={timer.id}
                    timer={timer}
                    onStart={() => startTimer(timer.id)}
                    onPause={() => pauseTimer(timer.id)}
                    onResume={() => resumeTimer(timer.id)}
                    onReset={() => resetTimer(timer.id)}
                    compact
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showIngredientConverter && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-xl">单位换算</CardTitle>
              <p className="text-gray-500">
                {formatIngredient(showIngredientConverter)}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">原始值</p>
                  <p className="text-2xl font-bold">
                    {formatQuantity(showIngredientConverter.quantity, showIngredientConverter.unit)}
                  </p>
                </div>

                <div className="text-center text-2xl font-bold text-gray-400">
                  ↓
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-600 mb-1">换算值 (基于密度)</p>
                  <p className="text-2xl font-bold text-blue-700">
                    {formatQuantity(convertedValue, convertedUnit)}
                  </p>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-700">
                    {showIngredientConverter.name} 密度: {findDensity(showIngredientConverter.name)} g/mL
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="touch"
                  className="w-full"
                  onClick={toggleUnit}
                >
                  切换为 {convertedUnit === "gram" ? "体积单位" : "重量单位"}
                </Button>

                <Button
                  variant="default"
                  size="touch"
                  className="w-full"
                  onClick={() => setShowIngredientConverter(null)}
                >
                  关闭
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
