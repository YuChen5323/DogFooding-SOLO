"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Camera, ChefHat, History, ArrowRight, Home } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IngredientCamera } from "@/components/IngredientCamera";
import { RecipeCard } from "@/components/RecipeCard";
import { DetectedIngredient, Recipe } from "@/types";
import { sampleRecipes, findMatchingRecipes } from "@/data/recipes";
import { getViewedRecipes } from "@/lib/indexedDB";

export default function HomePage() {
  const router = useRouter();
  const [matchedRecipes, setMatchedRecipes] = useState<Recipe[]>(sampleRecipes);
  const [recentRecipeIds, setRecentRecipeIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("recipes");

  useEffect(() => {
    async function loadRecentRecipes() {
      try {
        const viewed = await getViewedRecipes();
        setRecentRecipeIds(viewed.slice(0, 5));
      } catch (error) {
        console.error("Failed to load recent recipes:", error);
      }
    }
    loadRecentRecipes();
  }, []);

  const handleIngredientsDetected = (ingredients: DetectedIngredient[]) => {
    const ingredientNames = ingredients.map(i => i.name);
    const matches = findMatchingRecipes(ingredientNames);
    
    if (matches.length > 0) {
      setMatchedRecipes(matches);
      setActiveTab("recipes");
    }
  };

  const handleRecipeClick = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  const recentRecipes = recentRecipeIds
    .map(id => sampleRecipes.find(r => r.id === id))
    .filter(Boolean) as Recipe[];

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500 rounded-xl">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">CookAlong</h1>
              <p className="text-sm text-gray-500">实时互动烹饪教学</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 h-12">
            <TabsTrigger value="camera" className="text-base">
              <Camera className="w-5 h-5 mr-2" />
              扫描识别
            </TabsTrigger>
            <TabsTrigger value="recipes" className="text-base">
              <ChefHat className="w-5 h-5 mr-2" />
              菜谱库
            </TabsTrigger>
            <TabsTrigger value="recent" className="text-base">
              <History className="w-5 h-5 mr-2" />
              最近浏览
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera" className="mt-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                食材识别
              </h2>
              <p className="text-gray-600">
                用摄像头扫描您的食材，自动为您匹配可做的菜谱
              </p>
            </div>
            <IngredientCamera 
              onIngredientsDetected={handleIngredientsDetected}
            />
          </TabsContent>

          <TabsContent value="recipes" className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {matchedRecipes === sampleRecipes ? "全部菜谱" : "匹配结果"}
                </h2>
                <p className="text-gray-500 text-sm">
                  共 {matchedRecipes.length} 个菜谱
                </p>
              </div>
              {matchedRecipes !== sampleRecipes && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMatchedRecipes(sampleRecipes)}
                >
                  显示全部
                </Button>
              )}
            </div>

            <div className="grid gap-6">
              {matchedRecipes.map((recipe: any) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  matchedIngredients={recipe.matchedIngredients}
                  onClick={() => handleRecipeClick(recipe.id)}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="mt-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                最近浏览
              </h2>
              <p className="text-gray-600">
                您最近查看过的菜谱
              </p>
            </div>

            {recentRecipes.length > 0 ? (
              <div className="grid gap-6">
                {recentRecipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onClick={() => handleRecipeClick(recipe.id)}
                  />
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center">
                <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  暂无浏览记录
                </h3>
                <p className="text-gray-500 mb-6">
                  开始浏览菜谱后，这里会显示您最近查看的内容
                </p>
                <Button
                  variant="default"
                  size="touch"
                  onClick={() => setActiveTab("recipes")}
                >
                  <ChefHat className="w-5 h-5 mr-2" />
                  浏览菜谱
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-1 p-2">
          <Button
            variant="ghost"
            className={cn(
              "flex flex-col items-center h-auto py-2",
              activeTab === "camera" && "bg-orange-50 text-orange-600"
            )}
            onClick={() => setActiveTab("camera")}
          >
            <Camera className={cn(
              "w-6 h-6",
              activeTab === "camera" ? "text-orange-600" : "text-gray-500"
            )} />
            <span className="text-xs mt-1">扫描</span>
          </Button>
          
          <Button
            variant="ghost"
            className={cn(
              "flex flex-col items-center h-auto py-2",
              activeTab === "recipes" && "bg-orange-50 text-orange-600"
            )}
            onClick={() => setActiveTab("recipes")}
          >
            <ChefHat className={cn(
              "w-6 h-6",
              activeTab === "recipes" ? "text-orange-600" : "text-gray-500"
            )} />
            <span className="text-xs mt-1">菜谱</span>
          </Button>
          
          <Button
            variant="ghost"
            className={cn(
              "flex flex-col items-center h-auto py-2",
              activeTab === "recent" && "bg-orange-50 text-orange-600"
            )}
            onClick={() => setActiveTab("recent")}
          >
            <History className={cn(
              "w-6 h-6",
              activeTab === "recent" ? "text-orange-600" : "text-gray-500"
            )} />
            <span className="text-xs mt-1">最近</span>
          </Button>
        </div>
      </nav>
    </main>
  );
}
