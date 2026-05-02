package routes

import (
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"printing-typography-system/handlers"
)

func SetupRoutes(r *gin.Engine, db *gorm.DB) {
	handler := handlers.NewHandler(db)

	api := r.Group("/api")
	{
		glyphs := api.Group("/glyphs")
		{
			glyphs.GET("", handler.GetGlyphs)
			glyphs.GET("/radical/:radical", handler.GetGlyphsByRadical)
			glyphs.GET("/stroke/:count", handler.GetGlyphsByStrokeCount)
			glyphs.GET("/:id", handler.GetGlyphByID)
		}

		layouts := api.Group("/layouts")
		{
			layouts.GET("", handler.GetLayouts)
			layouts.POST("", handler.CreateLayout)
			layouts.GET("/:id", handler.GetLayoutByID)
			layouts.PUT("/:id", handler.UpdateLayout)
			layouts.DELETE("/:id", handler.DeleteLayout)
			layouts.GET("/:id/export", handler.ExportLayout)
		}

		api.GET("/health", handler.HealthCheck)
	}
}
