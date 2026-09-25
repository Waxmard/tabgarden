.PHONY: ci line-limit icons
ci: line-limit
	npm run check && npm test

line-limit:
	@bash scripts/check-line-limit.sh

CHROME ?= /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
icons:
	"$(CHROME)" --headless --disable-gpu --hide-scrollbars --default-background-color=00000000 \
		--window-size=1024,1024 --screenshot=/tmp/tabgarden-icon.png file://$(CURDIR)/assets/icon.svg
	mkdir -p src/icons
	for s in 16 32 48; do magick /tmp/tabgarden-icon.png -resize $${s}x$${s} src/icons/icon-$$s.png; done
	magick /tmp/tabgarden-icon.png -resize 96x96 -background none -gravity center -extent 128x128 src/icons/icon-128.png
