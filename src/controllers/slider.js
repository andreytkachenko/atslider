/**
 * Created by tkachenko on 14.04.15.
 */

ATF.controller('SliderController', ['$scope', 'jQuery', 'SliderData'],
    function ($scope, $, data) {
        $scope.$extend({
            items: [],
            data: [],
            itemsShow: {
                768:  3,
                1024: 2
            },
            itemWidth: 314,
            current: 0,
            showingItems: 2,
            span: 5,
            offset: 0,
            currentOffset: 0,
            prevOffset: 0,
            width: 0,
            scrollLeft: 0,
            _handler: null,
            _handler2: null,
            transition: true,
            scrollingEnabled: true,
            scrolling: false,
            animating: false,

            _normalizeIndex: function (_index) {
                var length = this.data.length;
                var index = _index % length;

                if (index < 0) {
                    index = length + index;
                } else if (index >= length) {
                    index = index - length;
                }

                return index;
            },

            _updateOffset: function () {
                var items = [],
                    i, item, cache = {},
                    left = -this.span + this.offset,
                    right = (this.span + 5 + this.offset) - 1;

                for (i = 0; i < this.items.length; i++) {
                    this.items[i].moving = false;
                    if (this.items[i].offset < left ||
                        this.items[i].offset > right) {

                        items.push(i);
                    } else {
                        cache[this.items[i].offset] = true;
                    }
                }

                for (i = -this.span + this.offset; i < (this.span + 5 + this.offset) - 1; i++) {
                    if (!cache[i]) {
                        item = items.pop();

                        this.items[item].offset = i;
                        this.items[item].meta = this._normalizeIndex(i);
                        this.items[item].moving = true;

                        this.checkImage(this.items[item].meta);
                    }
                }
            },

            setOffset: function (value) {
                this.scrollLeft = value;
                if (!this.scrollingEnabled) {
                    return;
                }

                this.scrolling = true;
                this.offset = Math.round(value / this.itemWidth);

                if (this._handler) clearTimeout(this._handler);
                this._handler = setTimeout((function() {
                    this.scrolling = false;
                    var absOffset = Math.abs(value % this.itemWidth);
                    if (absOffset > this.itemWidth / 2) {
                        absOffset = -(this.itemWidth - absOffset);
                    }
                    if (absOffset) {
                        this.transitionScrolling(absOffset);
                    }
                    this.$digest();
                }).bind(this), 100);

                if (this.offset !== this.prevOffset) {
                    this.prevOffset = this.offset;
                    setTimeout((function () {
                        this._updateOffset();
                        this.$digest();
                    }).bind(this), 0);
                }
            },

            transitionScrolling: function (gap, callback) {
                this.targetScrollPosition = this.scrollLeft + gap;
                console.log(this.targetScrollPosition, gap);

                if (this.scrollLeft < 0) {
                    this.targetScrollPosition = this.scrollLeft + gap;
                } else {
                    this.targetScrollPosition = this.scrollLeft - gap;
                }

                this.transitionScrollingInProgress = true;

                var func = (function () {
                    var gap = this.targetScrollPosition - this.scrollLeft;
                    var absGap = Math.abs(gap);

                    if (absGap < 2) {
                        this.scrollLeft = this.targetScrollPosition;
                        this.timeout = null;
                        setTimeout((function () {
                            this.transitionScrollingInProgress = false;
                            if(callback)callback();
                        }).bind(this), 0);
                    } else if (absGap < 12) {
                        this.scrollLeft += gap >> 1;
                        this.timeout = setTimeout(func, 40);
                    } else {
                        this.scrollLeft += gap >> 2;
                        this.timeout = setTimeout(func, 20);
                    }

                    this.$digest();
                }).bind(this);

                if (!this.timeout) func();

                this.$digest();
            },

            next: function () {
                this.transitionScrolling(this.scrollLeft >= 0 ? -this.itemWidth : this.itemWidth);
            },

            previous: function () {
                this.transitionScrolling(this.scrollLeft >= 0 ? this.itemWidth : -this.itemWidth);
            },

            checkImage: function (index) {
                var img = new Image();
                img.src = this.data[index].previewSrc;
                img.onerror = (function () {
                    this.onImageLoadError(index);
                }).bind(this);
            },

            onTouchStart: function () {
                if (this._handler) {
                    clearTimeout(this._handler);
                    this._handler = null;
                }
                if (this.timeout) {
                    clearTimeout(this.timeout);
                    this.timeout = null;
                }
            },

            onImageLoadError: function (index) {
                this.data.splice(index, 1);
                for (var i = 0; i < this.items.length; i++) {
                    this.items[i].meta = this._normalizeIndex(this.items[i].offset);
                }

                this.$$parent.$apply();
            },

            setShowingItems: function (items) {
                items = Math.max(items, 1);
                if (this.showingItems !== items) {
                    this.showingItems = items;

                    this.$apply();
                }
            },

            setItemWidth: function (width) {
                this.itemWidth = width;

                if (this._handler2) clearTimeout(this._handler2);
                this._handler2 = setTimeout((function () {
                    this.$digest();
                    this._handler2 = null;
                }).bind(this), 200);
            },

            goto: function (id) {
                var offset = 0;
                while (this.data[this._normalizeIndex(this.offset + offset)].id !== id) {
                    if (offset === 0) {
                        offset++;
                        continue;
                    }
                    if (offset < 0) offset--;
                    offset = -offset;
                }

                this.scrollLeft = (this.offset + offset) * this.itemWidth;
                this.$digest();
            },

            initialize: function () {
                this.width = this.itemWidth * 1000;
                this.scrollLeft = 0;
                for (var i = -this.span; i < this.span + 5; i++) {
                    var index = this._normalizeIndex(i);
                    this.items.push({
                        offset: i,
                        meta: index
                    });
                    this.checkImage(index);
                }
            }
        });

        var update = function () {
            var width = $(window).width();
            var items = Math.floor(width / 306),
                itemWidth = 306;

            if (width < 732) {
                items = 3;
                itemWidth = Math.floor(width / 3);
            }

            if (width < 480) {
                items = 2;
                itemWidth = Math.floor(width / 2);
            }

            $scope.setShowingItems(Math.max(items, 2));
            $scope.setItemWidth(itemWidth);
        };

        $(window).resize(function () {
            update();
        });

        $scope.$on('goto', function (id) {
            this.goto(id);
        });

        $scope.$watch('data', function () {
            $scope.initialize();
            update();
        });

        data.then(function (data) {
            $scope.data = data.slice(0);
            $scope.$apply();
        });
    }
);