
Vue.component('checkbox', {
    template: '<div class="icheckbox_square-blue" v-bind:class="{checked:selected===true}" @click="clicked"></div>',
    props: ['item'],
    data: function() {
        return {
            selected: false
        }
    },
    methods: {
        clicked: function() {
            var self = this;
            this.selected = !this.selected;
            if(this.item) {
                this.item.selected = this.selected;
            }
            this.$dispatch('change', this.selected);
        }
    },
    ready: function() {
        if(this.item)
            this.$watch('item.selected', function(a) {
                this.selected = a;
            })
    }
});

function escapeRegExp(string){
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

new Vue({
    el: 'body',
    data: {
        items: [],
        curPage: 0,
        limit: 10,
        search: '',
        asc: true,
        sortCol: 0,
        keys: ['id', 'name', 'company', 'email', 'phone', 'balance']
    },
    computed: {
        pageTotal: function() {
            return this.curPageItems.map(function(item) {
                return item.balance;
            }).reduce(function(a, b) {
                return a + b;
            }, 0);
        },
        startIndex: function() {
            return this.curPageItems.length ? this.curPage * this.limit + 1 : 0;
        },
        endIndex: function() {
            return this.curPage * this.limit + this.curPageItems.length;
        },
        totalPages: function() {
            return Math.ceil(this.filteredItems.length / this.limit);
        },
        curPageItems: function() {
            var limit = parseInt(this.limit);
            var startIndex = this.curPage * limit;
            // console.log('slicing from ' + startIndex + ' to ' + (startIndex + this.limit))
            return this.filteredItems.slice(startIndex, startIndex + limit);
        },
        filteredItems: function() {
            var items = this.items;
            if(this.search) {
                var regex = new RegExp('.*' + escapeRegExp(this.search) + '.*', 'i');
                items = this.items.filter(function(row) {
                    for(key in row) {
                        if(regex.test(row[key])) {
                            return true;
                        }
                    }
                    return false;
                });
            }
            items = _.sortBy(items, this.keys[this.sortCol]);
            if(this.asc === false) {
                items.reverse();
            }
            return items;
        },
        mid: function() {
            if(this.curPage < 4) {
                return this.range(3, 3);
            } else if(this.curPage > this.totalPages - 4) {
                // console.log('end')
                var start = this.totalPages - 4;
                return this.range(start, 3);
            } else {
                var start = this.curPage;
                return this.range(start, 3);
            }
        },
        pages: function() {
            var limit = this.limit;
            var items = this.filteredItems;
            var curPage = this.curPage;
            var length = items.length;
            var totalPages = this.totalPages;
            if(totalPages > 7) {
                var pages = []; // paginated pages

                // first page
                pages.push({index : 1});
                // front cover
                if(curPage < 5) {
                    pages.push({index : 2});
                } else {
                    pages.push({index : '...'});
                }
                // middle "3"
                var middle_start = curPage - 1;
                var middle_end = curPage + 2;
                if(curPage < 5) {
                    middle_start = 3;
                    middle_end = 6;
                } else if(curPage > totalPages - 3) {
                    middle_start = totalPages - 4;
                    middle_end = totalPages - 1;
                }
                for(var i = middle_start; i < middle_end; i++) {
                    pages.push({index : i});
                }
                // back cover
                if(curPage < totalPages - 3) {
                    pages.push({index : '...'});
                } else {
                    var back_cover = totalPages - 1;
                    pages.push({index : back_cover});
                }
                // last page
                pages.push({index : totalPages});

                return pages;
            } else {
                var pages = [];
                for(var i = 1; i <= totalPages; i++) {
                    pages.push({index : i});
                }
                return pages;
            }
        }
    },
    ready: function() {
        var self = this;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', '/data.json');
        xhr.onload = function() {
            if(xhr.status == 200) {
                var data = JSON.parse(xhr.responseText);
                data.items.forEach(function(item) {
                    item.selected = false;
                });
                // console.log(data);
                self.items = data.items;
            }
        }
        xhr.send();
    },
    methods: {
        selectAll : function(selected) {
            this.curPageItems.forEach(function(item) {
                item.selected = selected;
            });
        },
        check: function(selected) {
            var master = this.$refs.selectAll;
            if(selected) {
                var checked = this.curPageItems.filter(function(item) {
                    return item.selected;
                }).length;
                if(checked === this.limit) {
                    master.selected = true;
                }
            } else {
                var checked = this.curPageItems.filter(function(item) {
                    return item.selected;
                }).length;
                if(checked === 0) {
                    master.selected = false;
                }
            }
        },
        sortToggle: function(e) {
            var index = $(e.target).index();
            if(index == this.sortCol) {
                this.asc = !this.asc;
            } else {
                this.asc = true;
                this.sortCol = index;
            }
        },
        changePage: function(e) {
            e.preventDefault();
            var page = parseInt(e.target.innerHTML);
            // console.log('changing page to ' + page);
            if(isNaN(page) !== true) {
                // console.log('bingo')
                this.curPage = page - 1;
            }
        },
        next: function(e) {
            e.preventDefault();
            if(this.curPage < this.totalPages - 1)
                this.curPage++;
        },
        previous: function(e) {
            e.preventDefault();
            if(this.curPage > 0) {
                this.curPage--;
            }
        },
        range: function(start, count) {
            return Array.apply(0, Array(count)).map(function(element, index) {
                return index + start;
            });
        }
    }
});