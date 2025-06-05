
import React from 'react';
import { COURSES_DATA } from '../../constants';
import { Course } from '../../types';
import AnimatedDiv from '../ui/AnimatedDiv';
import Button from '../ui/Button';
import { ShoppingCart, Info } from 'lucide-react';

interface ProductCardProps {
    course: Course;
}

const ProductCard: React.FC<ProductCardProps> = ({ course }) => {
    const IconComponent = course.icon;

    return (
        <AnimatedDiv
            animation="fadeInUp"
            className={`group bg-white dark:bg-secondary-light rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col transform hover:-translate-y-1.5 h-full border-t-4 ${course.color ? '' : 'border-primary'}`}
            style={{ borderColor: course.color ? '' : undefined }}
        >
            <div className={`p-5 sm:p-6 ${course.color || 'bg-primary'} text-white dark:text-gray-100 flex items-center`}> {/* Removed space-x-5 rtl:space-x-reverse */}
                <div className="flex-shrink-0 me-4 sm:me-5 bg-white/20 dark:bg-black/20 p-3 sm:p-3.5 rounded-xl shadow-md group-hover:bg-white/30 dark:group-hover:bg-black/30 transition-colors duration-300"> {/* Added me-4 sm:me-5 */}
                    <IconComponent
                        size={30}
                        className="text-white opacity-90 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-3deg]"
                        strokeWidth={2}
                    />
                </div>
                <h3 className="text-lg sm:text-xl font-bold flex-grow leading-tight group-hover:text-yellow-300 dark:group-hover:text-yellow-300 transition-colors duration-200">{course.title}</h3>
            </div>

            <div className="p-5 sm:p-6 flex flex-col flex-grow">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4 leading-relaxed flex-grow line-clamp-4 sm:line-clamp-none">
                    {course.description}
                </p>

                {course.price && (
                    <div className="text-2xl sm:text-3xl font-bold text-primary dark:text-primary-light my-3 text-center">
                        {course.price}
                    </div>
                )}

                <div className="mt-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                        variant="primary"
                        size="md"
                        href={(course.links && course.links.length > 0) ? course.links[0].href : "#"}
                        external={!!(course.links && course.links.length > 0)}
                        className="w-full"
                        icon={<ShoppingCart size={18} />}
                    >
                        רכישה
                    </Button>
                    <Button
                        variant="outline"
                        size="md"
                        href={(course.links && course.links.length > 0) ? course.links[0].href : "#"}
                        external={!!(course.links && course.links.length > 0)}
                        className="w-full"
                        icon={<Info size={18} />}
                    >
                        פרטים נוספים
                    </Button>
                </div>
            </div>
        </AnimatedDiv>
    );
};

const ShopSection: React.FC = () => {
    return (
        <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-br from-gray-100 via-slate-100 to-sky-50 dark:from-secondary-dark dark:via-gray-800 dark:to-secondary">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <AnimatedDiv animation="fadeInUp" className="text-center mb-12 sm:mb-16">
                    <h2 className="text-lg font-semibold text-primary tracking-wider uppercase">החנות שלנו</h2>
                    <p className="mt-2 text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white leading-tight">
                        רכשו קורס והתחילו ללמוד
                    </p>
                </AnimatedDiv>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {COURSES_DATA.map((course) => (
                        <ProductCard key={course.id} course={course} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ShopSection;
