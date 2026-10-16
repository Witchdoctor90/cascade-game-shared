# Промо-ролики Cascade

Два ролики 1920×1080, 60 к/с, 28,5 с: українська та англійська версії. Кадри малює `scene.html` (той самий рушій гри, що на лендингу, з фіксованим зерном, тому обидві мови показують одну й ту саму партію). Звук синтезує `audio.py` з тих самих подій гри.

```bash
python3 promo/render.py --lang uk --out uk_silent.mp4 --cues cues.json
python3 promo/render.py --lang en --out en_silent.mp4
python3 promo/audio.py cues.json audio.wav
ffmpeg -i uk_silent.mp4 -i audio.wav -c:v copy -c:a aac -b:a 192k -af loudnorm=I=-14:TP=-1.5 -shortest cascade_uk.mp4
```

Потрібні Python 3 із `playwright` (Chromium), `numpy`, `scipy` і `ffmpeg`. Для перегляду окремих кадрів: `--preview 7.0,11.5 --outdir папка`.

## Що де змінювати

- Тексти: об'єкт `TEXT` на початку `scene.html` (рядки збігаються з лендингом).
- Сцени й таймінги: константи `S`, `POPS`, `THEME_AT`, `BADGE_AT` і таблиця `MAP` (час відео → час гри).
- Партія: `SEED` у `scene.html` і `stage.js` (у пізній грі поле підміняється щільнішим, щоб вийшов довгий ланцюжок). `seedscan.py` перебирає зерна й показує, коли які ходи й комбо.

## Кінцева плашка

У фіналі стоїть плашка «Завантажити в Google Play» у стилі спільного компонента `shared/play-badge.js`, а не офіційний бейдж Google. Перед публікацією ролика в Play або в рекламі замініть її на офіційний бейдж із [Google Play badge generator](https://play.google.com/intl/en_us/badges/) (Google вимагає свою графіку без змін).
