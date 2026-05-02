package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"printing-typography-system/models"
	"printing-typography-system/routes"
)

var DB *gorm.DB

func initDB() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}

	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "host=localhost user=postgres password=postgres dbname=printing_system port=5432 sslmode=disable"
	}

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	DB = db

	err = DB.AutoMigrate(
		&models.CharacterGlyph{},
		&models.Layout{},
	)
	if err != nil {
		log.Fatalf("Failed to migrate database: %v", err)
	}

	initSampleData(DB)
}

func initSampleData(db *gorm.DB) {
	var count int64
	db.Model(&models.CharacterGlyph{}).Count(&count)
	if count > 0 {
		return
	}

	sampleGlyphs := []models.CharacterGlyph{
		{Character: "一", Radical: "一", StrokeCount: 1, Unicode: "U+4E00", FontStyle: "kai"},
		{Character: "二", Radical: "二", StrokeCount: 2, Unicode: "U+4E8C", FontStyle: "kai"},
		{Character: "三", Radical: "一", StrokeCount: 3, Unicode: "U+4E09", FontStyle: "kai"},
		{Character: "四", Radical: "囗", StrokeCount: 5, Unicode: "U+56DB", FontStyle: "kai"},
		{Character: "五", Radical: "一", StrokeCount: 4, Unicode: "U+4E94", FontStyle: "kai"},
		{Character: "六", Radical: "八", StrokeCount: 4, Unicode: "U+516D", FontStyle: "kai"},
		{Character: "七", Radical: "一", StrokeCount: 2, Unicode: "U+4E03", FontStyle: "kai"},
		{Character: "八", Radical: "八", StrokeCount: 2, Unicode: "U+516B", FontStyle: "kai"},
		{Character: "九", Radical: "丿", StrokeCount: 2, Unicode: "U+4E5D", FontStyle: "kai"},
		{Character: "十", Radical: "十", StrokeCount: 2, Unicode: "U+5341", FontStyle: "kai"},
		{Character: "天", Radical: "大", StrokeCount: 4, Unicode: "U+5929", FontStyle: "kai"},
		{Character: "地", Radical: "土", StrokeCount: 6, Unicode: "U+5730", FontStyle: "kai"},
		{Character: "人", Radical: "人", StrokeCount: 2, Unicode: "U+4EBA", FontStyle: "kai"},
		{Character: "日", Radical: "日", StrokeCount: 4, Unicode: "U+65E5", FontStyle: "kai"},
		{Character: "月", Radical: "月", StrokeCount: 4, Unicode: "U+6708", FontStyle: "kai"},
		{Character: "山", Radical: "山", StrokeCount: 3, Unicode: "U+5C71", FontStyle: "kai"},
		{Character: "水", Radical: "水", StrokeCount: 4, Unicode: "U+6C34", FontStyle: "kai"},
		{Character: "木", Radical: "木", StrokeCount: 4, Unicode: "U+6728", FontStyle: "kai"},
		{Character: "火", Radical: "火", StrokeCount: 4, Unicode: "U+706B", FontStyle: "kai"},
		{Character: "土", Radical: "土", StrokeCount: 3, Unicode: "U+571F", FontStyle: "kai"},
		{Character: "春", Radical: "日", StrokeCount: 9, Unicode: "U+6625", FontStyle: "kai"},
		{Character: "夏", Radical: "夂", StrokeCount: 10, Unicode: "U+590F", FontStyle: "kai"},
		{Character: "秋", Radical: "禾", StrokeCount: 9, Unicode: "U+79CB", FontStyle: "kai"},
		{Character: "冬", Radical: "夂", StrokeCount: 5, Unicode: "U+51AC", FontStyle: "kai"},
		{Character: "风", Radical: "风", StrokeCount: 4, Unicode: "U+98CE", FontStyle: "kai"},
		{Character: "花", Radical: "艹", StrokeCount: 7, Unicode: "U+82B1", FontStyle: "kai"},
		{Character: "雪", Radical: "雨", StrokeCount: 11, Unicode: "U+96EA", FontStyle: "kai"},
		{Character: "诗", Radical: "讠", StrokeCount: 8, Unicode: "U+8BD7", FontStyle: "kai"},
		{Character: "书", Radical: "乙", StrokeCount: 4, Unicode: "U+4E66", FontStyle: "kai"},
	}

	for _, glyph := range sampleGlyphs {
		db.Create(&glyph)
	}

	log.Println("Sample data initialized")
}

func main() {
	initDB()

	r := gin.Default()

	config := cors.DefaultConfig()
	config.AllowOrigins = []string{"http://localhost:3000", "http://127.0.0.1:3000"}
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Authorization"}
	config.AllowCredentials = true

	r.Use(cors.New(config))

	routes.SetupRoutes(r, DB)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s...", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
