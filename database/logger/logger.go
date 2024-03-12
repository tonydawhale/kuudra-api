package logger

import (
	"log"
	"time"

	"github.com/TwiN/go-color"
)

func getTime() string {
	return time.Now().Format("2006-01-02 15:04:05")
}

func Debug(message string) {
	println(color.With(color.Cyan, "[" + getTime() + "] - [KuudraAPI-DEBUG] " + message))
}

func Warn(message string) {
	println(color.With(color.Yellow, "[" + getTime() + "] - [KuudraAPI-WARN] " + message))
}
func Log(message string) {
	println(color.With(color.Green, "[" + getTime() + "] - [KuudraAPI] " + message))
}
func Error(message string) {
	println(color.With(color.Red, "[" + getTime() + "] - [KuudraAPI-ERROR] " + message))
}
func Info(message string) {
	println(color.With(color.Blue, "[" + getTime() + "] - [KuudraAPI-INFO] " + message))
}
func Fatal(message string) {
	log.Fatal(color.With(color.Red, "[" + getTime() + "] - [KuudraAPI-FATAL] " + message))
}