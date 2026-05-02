package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CharacterGlyph struct {
	ID          string    `json:"id" gorm:"primaryKey"`
	Character   string    `json:"character" gorm:"not null;index"`
	Radical     string    `json:"radical" gorm:"index"`
	StrokeCount int       `json:"strokeCount" gorm:"index"`
	Unicode     string    `json:"unicode"`
	FontStyle   string    `json:"fontStyle"`
	ImageURL    string    `json:"imageUrl,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

func (g *CharacterGlyph) BeforeCreate(tx *gorm.DB) error {
	if g.ID == "" {
		g.ID = uuid.New().String()
	}
	return nil
}

type Layout struct {
	ID          string    `json:"id" gorm:"primaryKey"`
	Name        string    `json:"name" gorm:"not null"`
	Description string    `json:"description,omitempty"`
	Settings    JSONB     `json:"settings" gorm:"type:jsonb;not null"`
	Characters  JSONB     `json:"characters" gorm:"type:jsonb"`
	Elements    JSONB     `json:"elements" gorm:"type:jsonb"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

func (l *Layout) BeforeCreate(tx *gorm.DB) error {
	if l.ID == "" {
		l.ID = uuid.New().String()
	}
	return nil
}

type JSONB map[string]interface{}

type LayoutSettings struct {
	PageWidth     float64 `json:"pageWidth"`
	PageHeight    float64 `json:"pageHeight"`
	MarginTop     float64 `json:"marginTop"`
	MarginBottom  float64 `json:"marginBottom"`
	MarginLeft    float64 `json:"marginLeft"`
	MarginRight   float64 `json:"marginRight"`
	LineSpacing   float64 `json:"lineSpacing"`
	CharSpacing   float64 `json:"charSpacing"`
	FontSize      float64 `json:"fontSize"`
	FontFamily    string  `json:"fontFamily"`
	TextColor     string  `json:"textColor"`
	BackgroundColor string `json:"backgroundColor"`
}

type LayoutCharacter struct {
	ID       string          `json:"id"`
	Glyph    CharacterGlyph  `json:"glyph"`
	X        float64         `json:"x"`
	Y        float64         `json:"y"`
	Width    float64         `json:"width"`
	Height   float64         `json:"height"`
	Rotation float64         `json:"rotation"`
	ScaleX   float64         `json:"scaleX"`
	ScaleY   float64         `json:"scaleY"`
	Opacity  float64         `json:"opacity"`
	ZIndex   int             `json:"zIndex"`
}

type LayoutElement struct {
	ID     string                 `json:"id"`
	Type   string                 `json:"type"`
	X      float64                `json:"x"`
	Y      float64                `json:"y"`
	Width  float64                `json:"width"`
	Height float64                `json:"height"`
	Style  map[string]interface{} `json:"style"`
	ZIndex int                    `json:"zIndex"`
}

type ApiResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
	Error   string      `json:"error,omitempty"`
}
