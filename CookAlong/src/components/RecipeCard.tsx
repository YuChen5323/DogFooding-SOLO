"use client";

import React from "react";
import { Clock, Users, ChefHat, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Recipe } from "@/types";
import { formatDuration, formatDifficulty } from "@/lib/formatters";
import { cn } from "@/lib/utils";

interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
  matchedIngredients?: string[];
  className?: string;
}

const difficultyColors: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

export function RecipeCard({
  recipe,
  onClick,
  matchedIngredients,
  className,
}: RecipeCardProps) {
  const hasMatch = matchedIngredients && matchedIngredients.length > 0;
  
  return (
    <Card
      className={cn(
        "overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1",
        className
      )}
      onClick={onClick}
    >
      {recipe.imageUrl && (
        <div className="relative h-48 overflow-hidden bg-gray-100">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
          {hasMatch && (
            <div className="absolute top-3 right-3">
              <Badge variant="success" className="text-base px-3 py-1">
                <CheckCircle2 className="w-4 h-4 mr-1" />
                匹配 {matchedIngredients!.length} 种食材
              </Badge>
            </div>
          )}
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-xl font-bold line-clamp-2">
            {recipe.title}
          </CardTitle>
          <Badge className={cn("shrink-0", difficultyColors[recipe.difficulty] || "bg-gray-100")}>
            {formatDifficulty(recipe.difficulty)}
          </Badge>
        </div>
        <p className="text-gray-600 text-sm line-clamp-2 mt-1">
          {recipe.description}
        </p>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>准备 {formatDuration(recipe.prepTime)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ChefHat className="w-4 h-4" />
            <span>烹饪 {formatDuration(recipe.cookTime)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4" />
            <span>{recipe.servings} 人份</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {recipe.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {hasMatch && (
          <div className="p-3 bg-green-50 rounded-lg mb-4">
            <p className="text-sm font-medium text-green-700 mb-2">
              你有的食材：
            </p>
            <div className="flex flex-wrap gap-1.5">
              {matchedIngredients!.map((ingredient, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded text-sm"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {ingredient}
                </span>
              ))}
            </div>
          </div>
        )}

        <Button
          variant="default"
          size="touch"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          查看详情
        </Button>
      </CardContent>
    </Card>
  );
}
