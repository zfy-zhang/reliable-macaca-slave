current_version = $$(git branch 2>/dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/\1/')
npm_bin= $$(npm bin)

all: test
clean:
	rm -rf ./node_modules ./temp nohup.out
install:
	npm install
status:
	ps -ef | grep reliable-slave
kill:
	${npm_bin}/killing reliable-slave
lint:
	${npm_bin}/eslint .
.PHONY: test
