/**
 * Created by tkachenko on 14.04.15.
 */

ATF.controller('SliderController', ['$scope', 'jQuery'],
    function ($scope, $) {
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
                    right = (this.span + 5 + this.offset) - 1,
                    tmp = 0;

                for (i = 0; i < this.items.length; i++) {
                    this.items[i].moving = false;
                    if (this.items[i].offset < left ||
                        this.items[i].offset > right) {

                        items[items.length] = i;
                    } else {
                        cache[this.items[i].offset] = true;
                    }
                }

                for (i = -this.span + this.offset; i < (this.span + 5 + this.offset) - 1; i++) {
                    if (!cache[i]) {
                        item = items[tmp++];

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
                    this.scrollingEnabled = true;
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
                        this.transitionScrolling(absOffset, null, true);
                    }
                    this.$digest();
                }).bind(this), 100);

                if (this.offset !== this.prevOffset) {
                    var index = this._normalizeIndex(this.offset);
                    this.$emit('slider.slide', index, this.data[index], this.offset - this.prevOffset);
                    this.prevOffset = this.offset;
                    setTimeout((function () {
                        this._updateOffset();
                        this.$digest();
                    }).bind(this), 0);
                }
            },

            transitionScrolling: function (gap, callback, reset) {
                if (reset || this.targetScrollPosition === undefined) {
                    this.targetScrollPosition = this.scrollLeft;
                }

                if (this.scrollLeft < 0) {
                    this.targetScrollPosition = this.targetScrollPosition + gap;
                } else {
                    this.targetScrollPosition = this.targetScrollPosition - gap;
                }

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
                var item = this.data.splice(index, 1);
                for (var i = 0; i < this.items.length; i++) {
                    this.items[i].meta = this._normalizeIndex(this.items[i].offset);
                }

                this.$$parent.$apply();
                this.$emit('slider.image-fail', index, item[0]);
            },

            setShowingItems: function (items) {
                items = Math.max(items, 1);
                if (this.showingItems !== items) {
                    this.showingItems = items;

                    this.$apply();
                }
            },

            setItemWidth: function (width) {
                if (Number(this.itemWidth) !== Number(width)) {
                    this.itemWidth = width;
                    this.scrollLeft = this.offset * this.itemWidth;
                    this.targetScrollPosition = this.scrollLeft;
                    this.scrollingEnabled = false;
                    this.$digest();
                }
            },

            setData: function (data) {
                this.data = data;
                this.initialize();
                this.$digest();
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
                this.targetScrollPosition = this.scrollLeft;
                this.$digest();
            },

            initialize: function () {
                this.width = this.itemWidth * 1000;
                this.scrollLeft = 0;
                this.items = [];
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

        $scope.$on('goto', function (id) {
            this.goto(id);
        });
    }
);