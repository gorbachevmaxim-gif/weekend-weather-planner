import React from 'react';
import GstrdnmcLogo from "./icons/GstrdnmcLogo";
import GeeseIcon from "./icons/GeeseIcon";

interface OverlayContentProps {
    activeOverlay: 'manifesto' | 'rules' | 'velominati';
    theme: 'light' | 'dark';
}

const OverlayContent: React.FC<OverlayContentProps> = ({ activeOverlay, theme }) => {
    return (
        <div className={`mt-4 px-0 text-base leading-relaxed text-left w-full max-w-[343px] min-[1200px]:max-w-none mx-auto transition-colors duration-700 ${theme === 'dark' ? "text-[#aaaaaa]" : "text-[#333333]"}`}>
            {activeOverlay === 'manifesto' && (
                <>
                    <div className="mb-6">
                        <p>
                            Многие спрашивают, как можно присоединиться к Гастродинамике. Здесь мы описали что нужно делать, чтобы быть внутри комьюнити.
                        </p>
                    </div>
                    <div className="flex flex-col gap-y-4 pb-12">
                        <p>
                            <span className="font-bold">1.</span> Быть вовлеченным в нашу общую жизнь, помогать с организацией туров, не стесняться, проявлять инициативу. У каждого из нас есть свои сильные стороны, профессиональные навыки, связи в обществе и многое другое, что можно отдать ребятам в комьюнити. Подумайте что можете сделать именно вы.
                        </p>
                        <p>
                            <span className="font-bold">2.</span> Быть сильным во время заездов, не жаловаться, рассчитывать свои силы и поддерживать друг друга.
                        </p>
                        <p>
                            <span className="font-bold">3.</span> Можно ли быть слабым для больших райдов, но быть в Конечно, да! Глав сообществе?ное, быть воспитанным, отдавать в комьюнити больше, чем забирать, регулярно тренироваться, если необходимо, прогрессировать и присоединяться к заездам по готовности.
                        </p>
                        <p>
                            <span className="font-bold">4.</span> Проявлять интерес к еде и к людям, кто её создает. Вы можете не знать чем отличается итальянский трюфель от французского, или же фамилии всех шефов сибирских ресторанов, но нам хочется, чтобы каждый развивал свои вкусы и помогал бы находить новые направления для туров через интересную локальную гастрономию.
                        </p>
                        <p>
                            <span className="font-bold">5.</span> Следить за питанием, общим состоянием здоровья, не забывать о витаминах. Мы искренне проповедуем максимальную эффективность как во время туров, так и за их пределами, поэтому хотим, чтобы каждый внутри комьюнити ответственно подходил к тому, что он ест, какой образ жизни ведет, как восстанавливается после физических нагрузок.
                        </p>
                        <p>
                            <span className="font-bold">6.</span> Заботиться о своем велосипеде, делать регулярное обслуживание, располагать расходниками к нему и важными запчастями (особенно в турах, вдалеке от дома). Ни для кого из нас не в кайф вместо классного заезда в хорошей компании, ждать кого-либо на обочине по причине безответственного подхода к своей технике. Проявляйте такую же заботу к велосипеду, как и к самому себе.
                        </p>
                        <p>
                            <span className="font-bold">7.</span> Управлять ожиданиями в комьюнити, чтобы ни у кого не было недопониманий. Сразу спрашивать, если что-то непонятно, и не молчать, когда видите, что чего-то не хватает. Делать шаг вперед, если есть идея с чем можете всем помочь, но не знаете с чего начать. Говорить заранее, если с чем-то не согласны, а критикуя что-то — всегда предлагать свой вариант. И главное, беря ответственность за что-либо — быть прозрачным, доводить дело до конца или вовремя делегировать на другого участника.
                        </p>
                        <p>
                            <span className="font-bold">8.</span> Если по каким-то причинам решили не быть частью комьюнити, то это нормально — сообщите всем об этом, поблагодарим друг друга за опыт, обнимемся и будем спокойно жить дальше.
                        </p>
                        <div className={`pt-12 mt-12 border-t transition-colors duration-700 ${theme === 'dark' ? "border-[#333333]" : "border-[#D9D9D9]"} flex justify-center`}>
                            <GstrdnmcLogo fill={theme === 'dark' ? "#777777" : "#111111"} className="w-1/3 h-auto" />
                        </div>
                    </div>
                </>
            )}
            {activeOverlay === 'rules' && (
                <>
                    <div className="mb-6">
                        <p>
                            Мы едем не просто кататься, мы едем вместе. Чтобы райд прошел безопасно и в кайф, мы договариваемся о правилах «на берегу».
                        </p>
                    </div>
                    <div className="flex flex-col gap-y-4 pb-0">
                        <div>
                            <p className="font-bold text-lg mb-2">1. Я – не пассажир, я – пилот.</p>
                            <p>Организаторы обеспечивают логистику, маршрут и сопровождение. Но они не няньки.</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><span className="font-bold">Техника.</span> Я гарантирую исправность своего велосипеда, чистоту цепи и надежность тормозов. Навык самостоятельной замены камеры (покрышки) – обязателен.</li>
                                <li><span className="font-bold">Специфика маршрута.</span> Я понимаю, что любой райд требует подготовки «железа».
                                    <ul className="list-disc pl-5 mt-1">
                                        <li><span className="font-bold">Покрышки:</span> Подбор резины соответствует покрытию. Это мой залог зацепа и безопасности на спусках и поворотах.</li>
                                        <li><span className="font-bold">Трансмиссия:</span> Моя кассета подходит для рельефа. Я здесь, чтобы крутить педали и любоваться пейзажем, а не ломать колени на слишком тяжелых передачах.</li>
                                    </ul>
                                </li>
                                <li><span className="font-bold">Экипировка.</span> У меня в наличии: шлем (обязательно!), ремкомплект, запаска (камера или покрышка), насос и свет. Отсутствие чего-либо из списка – это моя личная ответственность, которую я решаю без задержки группы.</li>
                                <li><span className="font-bold">Тело.</span> У меня адекватная оценка своей физподготовки и полная уверенность в том, что заявленный километраж мне по силам.</li>
                            </ul>
                        </div>

                        <div>
                            <p className="font-bold text-lg mb-2">2. Дисциплина – это вежливость.</p>
                            <p>Семеро одного не ждут.</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><span className="font-bold">Старт.</span> Если сбор назначен на 8:00, в 8:00 мы уже в движении.</li>
                                <li><span className="font-bold">Опоздания.</span> В случае моего опоздания группа уезжает. Догонять придется самостоятельно и за свой счет (такси или своим ходом).</li>
                                <li><span className="font-bold">Брифинги.</span> Я внимательно слушаю брифинги и читаю чат. Вопросы о том, что уже было озвучено или написано – это неуважение к времени организаторов.</li>
                            </ul>
                        </div>

                        <div>
                            <p className="font-bold text-lg mb-2">3. Режим и Безопасность.</p>
                            <p>Мы здесь ради спорта и эмоций, а не ради угара.</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><span className="font-bold">Алкоголь.</span> Сухой закон действует с момента пробуждения и до финиша райда. Вечером – умеренное потребление, чтобы утром быть в отличной форме. Если из-за самочувствия я не могу ехать в общем темпе – см. пункт про «Опоздания».</li>
                                <li><span className="font-bold">Правила движения.</span> Мы едем по дорогам общего пользования. Я знаю и уважаю ПДД, следую только командам ведущих группу.</li>
                            </ul>
                        </div>

                        <div>
                            <p className="font-bold text-lg mb-2">4. Кодекс.</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><span className="font-bold">В группе</span> – мы уважаем темп друг друга. «Лоси» не дергают группу, «туристы» не лезут вперед. Желание ехать быстрее или медленнее – это мой выбор: я предупреждаю и еду соло, снимая ответственность с группы.</li>
                                <li><span className="font-bold">Поддержка</span> – если райдер пробил колесо или упал, мы останавливаемся и помогаем. Но если кто-то просто не тянет темп из-за отсутствия подготовки, то садится в машину сопровождения, чтобы не задерживать пелотон (см. п.1). Своих не бросаем, но и не тащим.</li>
                                <li><span className="font-bold">Гендер</span> – в смешанных группах мы соблюдаем культуру джентльменства. Мы не «дропаем» девушек на сложных участках, если едем в одной пачке.</li>
                            </ul>
                        </div>

                        <div>
                            <p className="font-bold text-lg mb-2">5. Отношение к организаторам.</p>
                            <p>Организаторы – это гиды вашего приключения, а не обслуживающий персонал.</p>
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Мы общаемся на равных и с уважением.</li>
                                <li>Любая помощь организаторам приветствуется и повышает карму (резерв ресторанов, организация трансфера и машины сопровождения).</li>
                            </ul>
                        </div>
                        <div className="pt-12 flex justify-center mx-[-16px] min-[1200px]:mx-[-64px]">
                            <GeeseIcon className={`w-[68%] min-[1200px]:w-[76%] h-auto transition-colors duration-700 ${theme === 'dark' ? "text-[#666666]" : ""}`} />
                        </div>
                    </div>
                </>
            )}
            {activeOverlay === 'velominati' && (
                <>
                    <div className="mb-6">
                        <p>
                            The Rules of The Velominati.
                        </p>
                    </div>
                    <div className="flex flex-col gap-y-6 pb-0">
                        <div>
                            <p className="font-bold text-lg mb-2">27</p>
                            <p>Shorts and socks should be like Goldilocks. Not too long and not too short. (Disclaimer: despite Sean Yates' horrible choice in shorts length, he is a quintessential hard man of cycling and is deeply admired by the Velominati. Whereas Armstrong's short and sock lengths are just plain wrong.) No socks is a no-no, as are those ankle-length ones that should only be worn by female tennis players.</p>
                        </div>

                        <div>
                            <p className="font-bold text-lg mb-2">29</p>
                            <p>No European Posterior Man-Satchels. Saddle bags have no place on a road bike, and are only acceptable on mountain bikes in extreme cases.</p>
                        </div>

                        <div>
                            <p className="font-bold text-lg mb-2">31</p>
                            <p>Spare tubes, multi-tools and repair kits should be stored in jersey pockets. If absolutely necessary, in a converted bidon in a cage on bike. Or, use one of these.</p>
                        </div>

                        <div>
                            <p className="font-bold text-lg mb-2">33</p>
                            <p>Shave your guns. Legs are to be carefully shaved at all times. If, for some reason, your legs are to be left hairy, make sure you can dish out plenty of hurt to shaved riders, or be considered a hippie douche on your way to a Critical Mass. Whether you use a straight razor or a Bowie knife, use Baxter to keep them smooth.</p>
                        </div>

                        <div>
                            <p className="font-bold text-lg mb-2">36</p>
                            <p>Eyewear shall be cycling specific. No Aviator shades, blueblockers, or clip-on covers for eye glasses.</p>
                        </div>

                        <div>
                            <p className="font-bold text-lg mb-2">41</p>
                            <p>Quick-release levers are to be carefully positioned. Quick release angle on the front skewer shall be an upward angle which tightens just aft of the fork and the rear quick release shall tighten at an angle that bisects angle between the seat and chain stays. It is acceptable, however, to have the rear quick release tighten upward, just aft of the seat stay, when the construction of the frame or its dropouts will not allow the preferred positioning. For Time Trial bikes only, quick releases may be in the horizontal position facing towards the rear of the bike. This is for maximum aero effect.</p>
                        </div>

                        <div>
                            <p className="font-bold text-lg mb-2">42</p>
                            <p>A bike ride shall never be preceded with a swim and/or followed by a run. If it's preceded with a swim and/or followed by a run, it is not called a bike ride, it is called duathlon or a triathlon. Neither of which is a bike race. Also keep in mind that one should only swim in order to prevent drowning, and should only run if being chased. And even then, one should only run fast enough to prevent capture.</p>
                        </div>

                        <div>
                            <p className="font-bold text-lg mb-2">43</p>
                            <p>Don't be a jackass. But if you absolutely must be a jackass, be a funny jackass. Always remember, we're all brothers and sisters on the road.</p>
                        </div>

                        <div>
                            <p className="font-bold text-lg mb-2">50</p>
                            <p>Facial hair is to be carefully regulated. No full beards, no moustaches. Goatees are permitted only if your name starts with "Marco" and ends with "Pantani", or if your head is intentionally or unintentionally bald. One may never shave on the morning of an important race, as it saps your virility, and you need that to kick ass.</p>
                        </div>

                        <div>
                            <p className="font-bold text-lg mb-2">52</p>
                            <p>Drink in Moderation. Bidons are to be small in size. 500-610ml maximum, no extra large vessels are to be seen on one's machine. Two cages can be mounted, but only one bidon on rides under two hours is to be employed. Said solo bidon must be placed in the downtube cage only. You may only ride with a bidon in the rear cage if you have a front bidon, or you just handed your front bidon to a fan at the roadside and you are too busy crushing everyone to move it forward until you take your next drink. Bidons should match each other and preferably your bike and/or kit.</p>
                        </div>

                        <div>
                            <p className="font-bold text-lg mb-2">59</p>
                            <p>Hold your line. Ride predictably, and don't make sudden movements. And, under no circumstances, are you to deviate from your line.</p>
                        </div>

                        <div>
                            <p className="font-bold text-lg mb-2">62</p>
                            <p>You shall not ride with earphones. Cycling is about getting outside and into the elements and you don't need to be listening to Queen or Slayer in order to experience that. Immerse yourself in the rhythm and pain, not in whatever 80's hair band you call "music".</p>
                        </div>

                        <div>
                            <p className="font-bold text-lg mb-2">72</p>
                            <p>Legs speak louder than words. Unless you routinely demonstrate your riding superiority and the smoothness of your Stroke, refrain from discussing your power meter, heartrate, or any other riding data.</p>
                        </div>

                        <div>
                            <p className="font-bold text-lg mb-2">74</p>
                            <p>V Meters or small computers only. Forego the data and ride on feel; little compares to the pleasure of riding as hard as your mind will allow. Learn to read your body, meditate on Rule #5, and learn to push yourself to your limit. Power meters, heart rate monitors and GPS are bulky, ugly and superfluous. Any cycle computer, if deemed necessary, should be simple, small, mounted on the stem and wireless.</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default OverlayContent;
