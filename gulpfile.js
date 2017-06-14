const gulp = require('gulp');

const babel = require('gulp-babel');
const minify = require('gulp-minify');

gulp.task('javascript', () => {
  return gulp.src('src/*.js')
    .pipe(babel({
      presets: ['es2015']
    }))
    .pipe(minify({
      ext:{
        src:'-debug.js',
        min:'.js'
      },
    }))
    .pipe(gulp.dest('dist'))
});

gulp.task('watch', () => {
  gulp.watch('src/*.js', ['javascript']);
});

gulp.task('default', ['javascript', 'watch']);
