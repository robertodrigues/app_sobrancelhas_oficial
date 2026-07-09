{step === 'density' ? (
        <div className={cn('grid gap-3', mode === 'comparison' ? 'grid-cols-3' : 'grid-cols-2')}>
          <button
            onClick={() => setActiveRegion('falha')}
            disabled={isSaving}
            className={cn(
              'flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all disabled:opacity-50',
              activeRegion === 'falha' ? 'border-[#9B59B6] bg-[#9B59B6]/20' : 'border-[#4A7A5C] bg-[#3D6B52]/30',
            )}
          >
            <div className="h-6 w-6 rounded-full bg-[#9B59B6]" />
            <span className="font-label-category text-[9px] text-[#E8DECE]">Falha / Rarefação</span>
          </button>

          <button
            onClick={() => setActiveRegion('ideal')}
            disabled={isSaving}
            className={cn(
              'flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all disabled:opacity-50',
              activeRegion === 'ideal' ? 'border-[#16A34A] bg-[#16A34A]/20' : 'border-[#4A7A5C] bg-[#3D6B52]/30',
            )}
          >
            <div className="h-6 w-6 rounded-full bg-[#16A34A]" />
            <span className="font-label-category text-[9px] text-[#E8DECE]">Densidade Ideal</span>
          </button>

          {mode === 'comparison' && (
            <button
              onClick={() => setActiveRegion('evolucao')}
              disabled={isSaving}
              className={cn(
                'flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-all disabled:opacity-50',
                activeRegion === 'evolucao' ? 'border-[#2563EB] bg-[#2563EB]/20' : 'border-[#4A7A5C] bg-[#3D6B52]/30',
              )}
            >
              <div className="h-6 w-6 rounded-full bg-[#2563EB]" />
              <span className="font-label-category text-[9px] text-[#E8DECE]">Evolução</span>
            </button>
          )}
        </div>
      ) : (