# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2025_11_22_120613) do
  create_table "courses", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.text "description"
    t.boolean "is_active", default: false, null: false
    t.boolean "is_default", default: false, null: false
    t.boolean "is_published", default: false
    t.string "language", null: false
    t.string "level"
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.index ["is_active"], name: "index_courses_on_is_active"
    t.index ["is_default"], name: "index_courses_on_is_default"
    t.index ["title"], name: "index_courses_on_title"
    t.index ["user_id", "is_active"], name: "index_courses_on_user_id_and_is_active"
    t.index ["user_id", "language"], name: "index_courses_on_user_id_and_language"
    t.index ["user_id"], name: "index_courses_on_user_id"
  end

  create_table "reports", force: :cascade do |t|
    t.decimal "accuracy", precision: 5, scale: 2, null: false
    t.integer "audio_duration"
    t.integer "course_id", null: false
    t.datetime "created_at", null: false
    t.json "incorrect_words", default: []
    t.text "reference_text", null: false
    t.text "transcribed_text"
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.integer "video_id", null: false
    t.json "word_details", default: []
    t.index ["accuracy"], name: "index_reports_on_accuracy"
    t.index ["course_id", "created_at"], name: "index_reports_on_course_id_and_created_at"
    t.index ["course_id"], name: "index_reports_on_course_id"
    t.index ["user_id", "created_at"], name: "index_reports_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_reports_on_user_id"
    t.index ["video_id", "created_at"], name: "index_reports_on_video_id_and_created_at"
    t.index ["video_id"], name: "index_reports_on_video_id"
  end

  create_table "subjects", force: :cascade do |t|
    t.integer "course_id", null: false
    t.datetime "created_at", null: false
    t.text "description"
    t.integer "difficulty", default: 1
    t.string "language", null: false
    t.string "name", null: false
    t.integer "position", default: 0
    t.datetime "updated_at", null: false
    t.index ["course_id", "language"], name: "index_subjects_on_course_id_and_language"
    t.index ["course_id", "name"], name: "index_subjects_on_course_id_and_name"
    t.index ["course_id"], name: "index_subjects_on_course_id"
    t.index ["name"], name: "index_subjects_on_name"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", null: false
    t.string "language", default: "en"
    t.string "membership", default: "free", null: false
    t.string "name", null: false
    t.string "password_digest", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["membership"], name: "index_users_on_membership"
  end

  create_table "videos", force: :cascade do |t|
    t.integer "course_id", null: false
    t.datetime "created_at", null: false
    t.string "did_talk_id"
    t.string "language", null: false
    t.string "local_uri"
    t.integer "position", default: 0
    t.string "remote_video_url", null: false
    t.integer "subject_id"
    t.text "text", null: false
    t.datetime "updated_at", null: false
    t.integer "user_id", null: false
    t.string "video_type", default: "normal"
    t.index ["course_id", "language"], name: "index_videos_on_course_id_and_language"
    t.index ["course_id"], name: "index_videos_on_course_id"
    t.index ["subject_id"], name: "index_videos_on_subject_id"
    t.index ["user_id", "language"], name: "index_videos_on_user_id_and_language"
    t.index ["user_id", "video_type"], name: "index_videos_on_user_id_and_video_type"
    t.index ["user_id"], name: "index_videos_on_user_id"
  end

  add_foreign_key "courses", "users"
  add_foreign_key "reports", "courses"
  add_foreign_key "reports", "users"
  add_foreign_key "reports", "videos"
  add_foreign_key "subjects", "courses"
  add_foreign_key "videos", "courses"
  add_foreign_key "videos", "subjects"
  add_foreign_key "videos", "users"
end
