current_version = $$(git branch 2>/dev/null | sed -e '/^[^*]/d' -e 's/* \(.*\)/\1/')
npm_bin= $$(npm bin)

all: test
clean:
	rm -rf ./node_modules ./temp nohup.out
install:
	DEVELOPMENT_TEAM_ID=86UCKG2C55 npm install --registry=https://registry.npm.taobao.org
status:
	ps -ef | grep reliable-macaca-slave

slave:
	./bin/reliable-macaca-slave server -m localhost:3333 --verbose

kill:
	${npm_bin}/killing reliable-macaca-slave
lint:
	${npm_bin}/eslint .
build-docker:
	docker build -t="reliable-macaca-slave" .
test: install
	@node --harmony \
		${npm_bin}/istanbul cover ${npm_bin}/_mocha \
		-- \
		--timeout 10000 \
		--require co-mocha
travis: install
	@NODE_ENV=test $(BIN) $(FLAGS) \
		./node_modules/.bin/istanbul cover \
		./node_modules/.bin/_mocha \
		--report lcovonly \
		-- -u exports \
		$(REQUIRED) \
		$(TESTS) \
		--bail
.PHONY: test
