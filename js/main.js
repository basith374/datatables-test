
$(document).ready(function() {
    $('#dataTable').DataTable({
        ajax: {
            url: 'http://www.pirivu.com/data.json',
            dataSrc: 'items'
        },
        columns: [
            {data : 'id'},
            {data : 'name'},
            {data : 'company'},
            {data : 'email'},
            {data : 'phone'},
            {data : 'balance'}
        ],
        dom: 'Blrftip',
        buttons: [
            {
                extend: 'print',
                exportOptions: {
                    columns: ':visible'
                },
                footer: true,
                customize: function ( win ) {
                    $(win.document.body)
                        .css( 'font-size', '10pt' );
 
                    $(win.document.body).find( 'table' )
                        .addClass( 'compact' )
                        .css( 'font-size', 'inherit' );
                }
            },
            'colvis'
        ],
        footerCallback: function ( row, data, start, end, display ) {
            var api = this.api(), data;
 
            // Remove the formatting to get integer data for summation
            var intVal = function ( i ) {
                return typeof i === 'string' ?
                    i.replace(/[\$,]/g, '')*1 :
                    typeof i === 'number' ?
                        i : 0;
            };
 
            // Total over all pages
            total = api
                .column( 5 )
                .data()
                .reduce( function (a, b) {
                    return intVal(a) + intVal(b);
                }, 0 );
 
            // Update footer
            $( api.column( 5 ).footer() ).html(total);
        }
    });
});

document.getElementById('printBtn').addEventListener('click', function() {
    // var table = document.getElementById('vueTable').parentNode.cloneNode(true);
    // console.log(table.querySelectorAll('tr').length);
    // var printPage = window.open();
    // var wrap = document.createElement('div').appendChild(table);
    // console.log(wrap.innerHTML)
    // printPage.document.write(wrap.innerHTML);
    // var printPage = window.open();
    // var stylesheet = document.createElement('link');
    // stylesheet.rel = 'stylesheet';
    // // stylesheet.media = 'print';
    // // stylesheet.type = 'text/css';
    // stylesheet.href = 'css/table.css';
    // printPage.document.head.appendChild(stylesheet);
    // setTimeout(function() {

    //     printPage.print();
    //     printPage.close();
    // }, 100);
});

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
        if(this.item) {
            this.selected = this.item.selected;
            this.$watch('item.selected', function(a) {
                this.selected = a;
            })
        }
    }
});

Vue.filter('ucfirst', {
    read: function(a) {
        return a.substr(0, 1).toUpperCase() + a.substr(1);
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
        sortCol: 'id',
        cols: ['id', 'name', 'company', 'email', 'phone', 'balance'],
        printCols: ['name', 'balance']
    },
    computed: {
        offset: function() {
            return this.limit * this.curPage;
        },
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
            items = _.sortBy(items, this.sortCol);
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
        newSearch: function() {
            this.curPage = 0;
        },
        selectAll : function(selected) {
            var target = selected ? this.curPageItems : this.items;
            target.forEach(function(item) {
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
        sortToggle: function(col) {
            if(col == this.sortCol) {
                this.asc = !this.asc;
            } else {
                this.asc = true;
                this.sortCol = col;
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
        },
        printTable: function() {
            var self = this;

            var printPage = window.open();

            var table = document.createElement('table');

            var thead = document.createElement('thead');
            var thead_tr = document.createElement('tr');
            this.printCols.forEach(function(col) {
                var td = document.createElement('th');
                td.innerHTML = col.substr(0, 1).toUpperCase() + col.substr(1);
                thead_tr.appendChild(td);
            })
            thead.appendChild(thead_tr);

            var tbody = document.createElement('tbody');
            this.items.forEach(function(item) {
                var tr = document.createElement('tr');
                self.printCols.forEach(function(col) {
                    var td = document.createElement('td');
                    td.innerHTML = item[col];
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            })

            var tfoot = document.createElement('tfoot');

            table.appendChild(thead);
            table.appendChild(tbody);
            table.appendChild(tfoot);

            var wrap = document.createElement('div');
            wrap.appendChild(table);
            // console.log(wrap.innerHTML);
            printPage.document.write(wrap.innerHTML);

            var stylesheet = document.createElement('link');
            stylesheet.rel = 'stylesheet';
            // stylesheet.media = 'print';
            // stylesheet.type = 'text/css';
            stylesheet.href = 'css/table.css';
            printPage.document.head.appendChild(stylesheet);
            setTimeout(function() {
                printPage.print();
            }, 100);
            // printPage.close();
        }
    }
});