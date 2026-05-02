package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"printing-typography-system/models"
)

type Handler struct {
	db *gorm.DB
}

func NewHandler(db *gorm.DB) *Handler {
	return &Handler{db: db}
}

func (h *Handler) HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Printing Typography System API is running",
	})
}

func (h *Handler) GetGlyphs(c *gin.Context) {
	var glyphs []models.CharacterGlyph
	if err := h.db.Order("stroke_count, character").Find(&glyphs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Failed to fetch glyphs",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    glyphs,
	})
}

func (h *Handler) GetGlyphsByRadical(c *gin.Context) {
	radical := c.Param("radical")
	if radical == "" {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Radical parameter is required",
		})
		return
	}

	var glyphs []models.CharacterGlyph
	if err := h.db.Where("radical = ?", radical).Order("stroke_count, character").Find(&glyphs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Failed to fetch glyphs by radical",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    glyphs,
	})
}

func (h *Handler) GetGlyphsByStrokeCount(c *gin.Context) {
	countStr := c.Param("count")
	var count int
	if _, err := gin.DefaultWriter.Write([]byte(countStr)); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Invalid stroke count",
		})
		return
	}

	var glyphs []models.CharacterGlyph
	if err := h.db.Where("stroke_count = ?", count).Order("character").Find(&glyphs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Failed to fetch glyphs by stroke count",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    glyphs,
	})
}

func (h *Handler) GetGlyphByID(c *gin.Context) {
	id := c.Param("id")

	var glyph models.CharacterGlyph
	if err := h.db.First(&glyph, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, models.ApiResponse{
				Success: false,
				Error:   "Glyph not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Failed to fetch glyph",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    glyph,
	})
}

func (h *Handler) GetLayouts(c *gin.Context) {
	var layouts []models.Layout
	if err := h.db.Order("updated_at DESC").Find(&layouts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Failed to fetch layouts",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    layouts,
	})
}

func (h *Handler) CreateLayout(c *gin.Context) {
	var layout models.Layout
	if err := c.ShouldBindJSON(&layout); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Invalid request body: " + err.Error(),
		})
		return
	}

	if layout.Name == "" {
		layout.Name = "未命名版面"
	}

	if err := h.db.Create(&layout).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Failed to create layout",
		})
		return
	}

	c.JSON(http.StatusCreated, models.ApiResponse{
		Success: true,
		Data:    map[string]string{"id": layout.ID},
		Message: "Layout created successfully",
	})
}

func (h *Handler) GetLayoutByID(c *gin.Context) {
	id := c.Param("id")

	var layout models.Layout
	if err := h.db.First(&layout, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, models.ApiResponse{
				Success: false,
				Error:   "Layout not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Failed to fetch layout",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Data:    layout,
	})
}

func (h *Handler) UpdateLayout(c *gin.Context) {
	id := c.Param("id")

	var existingLayout models.Layout
	if err := h.db.First(&existingLayout, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, models.ApiResponse{
				Success: false,
				Error:   "Layout not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Failed to fetch layout",
		})
		return
	}

	var updates models.Layout
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, models.ApiResponse{
			Success: false,
			Error:   "Invalid request body: " + err.Error(),
		})
		return
	}

	if updates.Name != "" {
		existingLayout.Name = updates.Name
	}
	if updates.Description != "" {
		existingLayout.Description = updates.Description
	}
	if updates.Settings != nil {
		existingLayout.Settings = updates.Settings
	}
	if updates.Characters != nil {
		existingLayout.Characters = updates.Characters
	}
	if updates.Elements != nil {
		existingLayout.Elements = updates.Elements
	}

	if err := h.db.Save(&existingLayout).Error; err != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Failed to update layout",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Layout updated successfully",
	})
}

func (h *Handler) DeleteLayout(c *gin.Context) {
	id := c.Param("id")

	result := h.db.Delete(&models.Layout{}, "id = ?", id)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Failed to delete layout",
		})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.ApiResponse{
			Success: false,
			Error:   "Layout not found",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Layout deleted successfully",
	})
}

func (h *Handler) ExportLayout(c *gin.Context) {
	id := c.Param("id")
	format := c.Query("format")
	if format == "" {
		format = "png"
	}

	var layout models.Layout
	if err := h.db.First(&layout, "id = ?", id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, models.ApiResponse{
				Success: false,
				Error:   "Layout not found",
			})
			return
		}
		c.JSON(http.StatusInternalServerError, models.ApiResponse{
			Success: false,
			Error:   "Failed to fetch layout",
		})
		return
	}

	c.JSON(http.StatusOK, models.ApiResponse{
		Success: true,
		Message: "Export functionality will be implemented in future versions",
		Data: map[string]interface{}{
			"layoutId": id,
			"format":   format,
			"layout":   layout,
		},
	})
}
