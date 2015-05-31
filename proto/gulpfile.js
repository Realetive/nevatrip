var gulp = require('gulp'),
    less = require('gulp-less');

gulp.task('less', function() {
    gulp.src('./src/less/bootstrap.less')
        .pipe(less())
        .pipe(gulp.dest('./public/assets/css'));
});